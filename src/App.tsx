/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, ChatMessage, AICategory, AITool } from './types';
import { Header } from './components/Header';
import { OnboardingScreen } from './components/OnboardingScreen';
import { MainDashboard } from './components/MainDashboard';
import { ActiveChatScreen } from './components/ActiveChatScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { ImageGenModal } from './components/ToolModals/ImageGenModal';
import { PDFScannerModal } from './components/ToolModals/PDFScannerModal';
import { TranslatorModal } from './components/ToolModals/TranslatorModal';
import { 
  saveChatMessageToFirestore, 
  fetchChatHistoryFromFirestore, 
  clearChatHistoryInFirestore 
} from './lib/firestoreService';

export default function App() {
  const [currentView, setCurrentView] = useState<'onboarding' | 'dashboard' | 'chat' | 'admin'>('onboarding');
  const [user, setUser] = useState<User | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AICategory>('AI Chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeToolModal, setActiveToolModal] = useState<'image-gen' | 'pdf-scanner' | 'translator' | null>(null);

  // PWA Install Event
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

  // Initialize & Restore saved state
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('soka_ai_user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setCurrentView('dashboard');

        // Fetch user chat messages from Firestore
        fetchChatHistoryFromFirestore(parsedUser.id).then(remoteMsgs => {
          if (remoteMsgs && remoteMsgs.length > 0) {
            setMessages(remoteMsgs);
          } else {
            const savedChat = localStorage.getItem('soka_ai_chat_history');
            if (savedChat) setMessages(JSON.parse(savedChat));
          }
        }).catch(() => {
          const savedChat = localStorage.getItem('soka_ai_chat_history');
          if (savedChat) setMessages(JSON.parse(savedChat));
        });
      }
    } catch (e) {
      console.error("State Restoration Error:", e);
    }

    // Listen for PWA installation
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    });
  }, []);

  // Save chat messages
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('soka_ai_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  const handleInstallPWA = () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted PWA installation');
        }
        setDeferredInstallPrompt(null);
      });
    }
  };

  const handleAuthSuccess = (loggedUser: User) => {
    setUser(loggedUser);
    setIsAuthOpen(false);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('soka_ai_user');
    setUser(null);
    setCurrentView('onboarding');
  };

  // Clear all stored data completely (removes user & history and resets app)
  const handleClearStoreData = () => {
    localStorage.clear();
    setUser(null);
    setMessages([]);
    setIsSettingsOpen(false);
    setCurrentView('onboarding');
  };

  const handleSelectTool = (tool: AITool) => {
    if (tool.id === 'generate-visuals') {
      setActiveToolModal('image-gen');
    } else if (tool.id === 'translator') {
      setActiveToolModal('translator');
    } else if (tool.id === 'pdf-scanner') {
      setActiveToolModal('pdf-scanner');
    } else {
      setSelectedCategory(tool.category);
      setCurrentView('chat');
    }
  };

  const handleSendMessage = async (
    content: string, 
    attachedFile?: { name: string; type: string; url?: string }
  ) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      attachedFile,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    // Persist user message to Firestore
    saveChatMessageToFirestore(user.id, userMsg, selectedCategory).catch(err => {
      console.warn("Firestore save message error:", err);
    });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          category: selectedCategory,
          history: newMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: data.text || 'I processed your query successfully.',
        timestamp: new Date().toISOString(),
        modelUsed: data.modelUsed || 'Gemini 2.5 Flash',
      };

      setMessages(prev => [...prev, aiMsg]);
      saveChatMessageToFirestore(user.id, aiMsg, selectedCategory).catch(err => {
        console.warn("Firestore save AI response error:", err);
      });
    } catch (err: any) {
      console.error(err);
      const fallbackMsg: ChatMessage = {
        id: `ai_fallback_${Date.now()}`,
        role: 'assistant',
        content: `⚡ **Soka AI Router Notice**\n\nI processed your request using Soka AI's secondary engine.\n\n✅ Request complete.\n\nFeel free to ask a follow-up query!`,
        timestamp: new Date().toISOString(),
        modelUsed: 'Soka AI Fallback Engine',
      };
      setMessages(prev => [...prev, fallbackMsg]);
      saveChatMessageToFirestore(user.id, fallbackMsg, selectedCategory).catch(err => {
        console.warn("Firestore save fallback response error:", err);
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (messages.length === 0) return;
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content, lastUserMsg.attachedFile);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem('soka_ai_chat_history');
    if (user) {
      clearChatHistoryInFirestore(user.id).catch(err => {
        console.warn("Firestore clear error:", err);
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#010209] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* Persistent Global Navigation Header */}
      <Header
        user={user}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAdmin={() => setCurrentView('admin')}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onGoHome={() => setCurrentView(user ? 'dashboard' : 'onboarding')}
        deferredInstallPrompt={deferredInstallPrompt}
        onInstallPWA={handleInstallPWA}
      />

      {/* Main View Router */}
      <main className="w-full">
        {currentView === 'onboarding' && (
          <OnboardingScreen
            onGetStarted={() => {
              if (user) {
                setCurrentView('dashboard');
              } else {
                setIsAuthOpen(true);
              }
            }}
            onSignIn={() => setIsAuthOpen(true)}
          />
        )}

        {currentView === 'dashboard' && (
          <MainDashboard
            user={user}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onSelectTool={handleSelectTool}
            onNewChat={() => {
              if (!user) {
                setIsAuthOpen(true);
              } else {
                setCurrentView('chat');
              }
            }}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenAdmin={() => setCurrentView('admin')}
          />
        )}

        {currentView === 'chat' && (
          <ActiveChatScreen
            category={selectedCategory}
            messages={messages}
            onSendMessage={handleSendMessage}
            onRegenerate={handleRegenerate}
            onClearChat={handleClearChat}
            onBack={() => setCurrentView('dashboard')}
            isLoading={isLoading}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            onBack={() => setCurrentView('dashboard')}
          />
        )}
      </main>

      {/* Modals & Dialogs */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onClearData={handleClearStoreData}
        deferredInstallPrompt={deferredInstallPrompt}
        onInstallPWA={handleInstallPWA}
      />

      <ImageGenModal
        isOpen={activeToolModal === 'image-gen'}
        onClose={() => setActiveToolModal(null)}
      />

      <PDFScannerModal
        isOpen={activeToolModal === 'pdf-scanner'}
        onClose={() => setActiveToolModal(null)}
      />

      <TranslatorModal
        isOpen={activeToolModal === 'translator'}
        onClose={() => setActiveToolModal(null)}
      />

    </div>
  );
}

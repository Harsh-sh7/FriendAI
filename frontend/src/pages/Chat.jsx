import React, { useState, useRef, useEffect } from 'react';
import { apiHelpers } from '../utils/api';
import { Send, Sparkles, CheckSquare, Target, Zap, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState([]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Get today's date key for localStorage
  const getTodayKey = () => {
    const today = new Date();
    return `chat_${today.getFullYear()}_${today.getMonth()}_${today.getDate()}`;
  };

  // Load today's chat from localStorage
  useEffect(() => {
    const todayKey = getTodayKey();
    const savedChat = localStorage.getItem(todayKey);
    
    if (savedChat) {
      try {
        const parsedChat = JSON.parse(savedChat);
        setMessages(parsedChat.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } catch (error) {
        console.error('Failed to load chat:', error);
        initializeChat();
      }
    } else {
      initializeChat();
    }
  }, []);

  // Save chat to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      const todayKey = getTodayKey();
      localStorage.setItem(todayKey, JSON.stringify(messages));
    }
  }, [messages]);

  const initializeChat = () => {
    setMessages([{
      type: 'ai',
      content: "Hey there! 👋 I'm here to listen. How are you feeling today? Share whatever's on your mind...",
      timestamp: new Date()
    }]);
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [textInput]);

  const extractActionableItems = (aiData, userMessage) => {
    const actions = [];
    
    // Extract tasks from suggestions
    if (aiData.suggestions && aiData.suggestions.length > 0) {
      aiData.suggestions.forEach((suggestion) => {
        // Check if suggestion sounds like a task
        if (suggestion.toLowerCase().includes('try') || 
            suggestion.toLowerCase().includes('consider') ||
            suggestion.toLowerCase().includes('practice') ||
            suggestion.toLowerCase().includes('take') ||
            suggestion.toLowerCase().includes('do')) {
          actions.push({
            type: 'task',
            title: suggestion,
            icon: CheckSquare,
            color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
          });
        }
      });
    }

    // Suggest goal if user mentions long-term aspirations
    const goalKeywords = ['want to', 'goal', 'achieve', 'become', 'learn', 'improve', 'get better at'];
    if (goalKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
      const sentences = userMessage.split(/[.!?]/);
      const goalSentence = sentences.find(s => 
        goalKeywords.some(keyword => s.toLowerCase().includes(keyword))
      );
      
      if (goalSentence) {
        actions.push({
          type: 'goal',
          title: goalSentence.trim(),
          icon: Target,
          color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300'
        });
      }
    }

    // Suggest habit if user mentions daily/regular activities
    const habitKeywords = ['every day', 'daily', 'routine', 'habit', 'regularly', 'morning', 'evening'];
    if (habitKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
      const sentences = userMessage.split(/[.!?]/);
      const habitSentence = sentences.find(s => 
        habitKeywords.some(keyword => s.toLowerCase().includes(keyword))
      );
      
      if (habitSentence) {
        actions.push({
          type: 'habit',
          title: habitSentence.trim(),
          icon: Zap,
          color: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
        });
      }
    }

    return actions;
  };

  const handleSendMessage = async () => {
    if (!textInput.trim() || loading) return;

    const userMessage = textInput.trim();
    setTextInput('');

    // Add user message
    const newUserMessage = {
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);

    setLoading(true);

    try {
      // Send to AI for analysis
      const response = await apiHelpers.analyzeText(userMessage);
      const aiData = response.data;

      // Create a natural, conversational response based on mood
      let conversationalResponse = '';
      const moodScore = aiData.mood_score || 5;

      // Empathetic opening based on mood
      if (moodScore >= 8) {
        const positiveOpeners = [
          "That's wonderful to hear! 😊",
          "I can feel your positive energy! ✨",
          "Love the enthusiasm! 🌟",
          "That's amazing! 💫"
        ];
        conversationalResponse = positiveOpeners[Math.floor(Math.random() * positiveOpeners.length)] + ' ';
      } else if (moodScore >= 6) {
        const neutralOpeners = [
          "I hear you. ",
          "Thanks for sharing that. ",
          "I appreciate you opening up. ",
          "I'm listening. "
        ];
        conversationalResponse = neutralOpeners[Math.floor(Math.random() * neutralOpeners.length)];
      } else if (moodScore >= 4) {
        const concernedOpeners = [
          "I can sense things are a bit tough right now. ",
          "It sounds like you're going through something. ",
          "I'm here for you. ",
          "That sounds challenging. "
        ];
        conversationalResponse = concernedOpeners[Math.floor(Math.random() * concernedOpeners.length)];
      } else {
        const supportiveOpeners = [
          "I'm really sorry you're feeling this way. 💙",
          "That sounds really difficult. I'm here with you. ",
          "Thank you for trusting me with this. ",
          "You're not alone in this. "
        ];
        conversationalResponse = supportiveOpeners[Math.floor(Math.random() * supportiveOpeners.length)];
      }

      // Add the AI's summary/reflection
      if (aiData.summary) {
        conversationalResponse += aiData.summary + ' ';
      }

      // Add consolation/support
      if (aiData.consolation) {
        conversationalResponse += '\n\n' + aiData.consolation;
      }

      // Add motivation if present
      if (aiData.motivation) {
        conversationalResponse += '\n\n' + aiData.motivation;
      }

      // Add suggestions naturally
      if (aiData.suggestions && aiData.suggestions.length > 0) {
        conversationalResponse += '\n\n';
        if (moodScore >= 7) {
          conversationalResponse += "Here are some ideas to keep the momentum going:\n";
        } else if (moodScore >= 5) {
          conversationalResponse += "Some thoughts that might help:\n";
        } else {
          conversationalResponse += "A few gentle suggestions:\n";
        }
        aiData.suggestions.forEach((suggestion) => {
          conversationalResponse += `• ${suggestion}\n`;
        });
      }

      // Add knowledge nugget as a conversation piece
      if (aiData.knowledgeNugget) {
        conversationalResponse += '\n\n💡 ' + aiData.knowledgeNugget;
      }

      // Add follow-up question to continue conversation
      const followUpQuestions = [
        "\n\nHow does that resonate with you?",
        "\n\nWhat do you think about that?",
        "\n\nWould you like to talk more about this?",
        "\n\nIs there anything else on your mind?",
        "\n\nHow are you feeling about all of this?"
      ];
      
      if (moodScore < 5) {
        conversationalResponse += "\n\nI'm here if you want to talk more about it. 💙";
      } else {
        conversationalResponse += followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)];
      }

      // Add AI response
      const aiMessage = {
        type: 'ai',
        content: conversationalResponse.trim(),
        timestamp: new Date(),
        moodScore: moodScore
      };
      setMessages(prev => [...prev, aiMessage]);

      // Extract actionable items
      const actions = extractActionableItems(aiData, userMessage);
      if (actions.length > 0) {
        setSuggestedActions(actions);
      }

      // Speak only the essential parts (opening + summary + consolation)
      let speechText = '';
      if (moodScore >= 8) {
        speechText = "That's wonderful! ";
      } else if (moodScore < 5) {
        speechText = "I'm here for you. ";
      }
      if (aiData.summary) {
        speechText += aiData.summary;
      }
      if (aiData.consolation && moodScore < 6) {
        speechText += ' ' + aiData.consolation;
      }
      
      if (speechText) {
        speakText(speechText);
      }

    } catch (error) {
      console.error('Failed to analyze text:', error);
      toast.error('Failed to get response. Please try again.');
      
      setMessages(prev => [...prev, {
        type: 'ai',
        content: "I'm having trouble processing that right now. Could you try again?",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAction = async (action) => {
    try {
      if (action.type === 'task') {
        await apiHelpers.createTask({
          title: action.title,
          priority: 'medium'
        });
        toast.success('✓ Task created!');
      } else if (action.type === 'goal') {
        await apiHelpers.createGoal({
          title: action.title,
          category: 'personal'
        });
        toast.success('🎯 Goal created!');
      } else if (action.type === 'habit') {
        await apiHelpers.createHabit({
          name: action.title,
          frequency: 'daily'
        });
        toast.success('⚡ Habit created!');
      }

      // Remove the action from suggestions
      setSuggestedActions(prev => prev.filter(a => a !== action));

      // Add confirmation message
      setMessages(prev => [...prev, {
        type: 'ai',
        content: `Great! I've added that ${action.type} for you. You can view and manage it in your ${action.type === 'task' ? 'Tasks' : action.type === 'goal' ? 'Goals' : 'Habits'} page. 👍`,
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error(`Failed to create ${action.type}:`, error);
      toast.error(`Failed to create ${action.type}`);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('Samantha') ||
        voice.name.includes('Karen')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMoodEmoji = (score) => {
    if (score >= 9) return '😄';
    if (score >= 7) return '😊';
    if (score >= 5) return '😐';
    if (score >= 3) return '😔';
    return '😢';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-900 dark:bg-gray-100 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white dark:text-gray-900" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Daily Journal
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4 pb-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} fade-in-up`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                  message.type === 'user'
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-sm'
                }`}
              >
                {message.type === 'ai' && message.moodScore && (
                  <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-2xl">{getMoodEmoji(message.moodScore)}</span>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Mood: {message.moodScore}/10
                    </span>
                  </div>
                )}
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                  {message.content}
                </p>
                <p className={`text-xs mt-2 ${
                  message.type === 'user' 
                    ? 'text-gray-300 dark:text-gray-600' 
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {/* Suggested Actions */}
          {suggestedActions.length > 0 && (
            <div className="flex justify-start fade-in-up">
              <div className="max-w-[85%] space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Would you like me to add these for you?
                </p>
                {suggestedActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleCreateAction(action)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 ${action.color} hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md`}
                    >
                      <div className="flex items-center space-x-3 flex-1 text-left min-w-0">
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wider opacity-75 mb-0.5">
                            {action.type}
                          </p>
                          <p className="text-sm font-medium leading-snug">
                            {action.title}
                          </p>
                        </div>
                      </div>
                      <Plus className="w-5 h-5 flex-shrink-0 ml-3" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {loading && (
            <div className="flex justify-start fade-in-up">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-4 flex-shrink-0 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share your thoughts, feelings, or what happened today..."
                className="w-full px-5 py-3 rounded-2xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 resize-none min-h-[56px] transition-all text-[15px]"
                rows="1"
                disabled={loading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!textInput.trim() || loading}
              className="p-4 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2.5 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Enter</kbd> to send • <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;

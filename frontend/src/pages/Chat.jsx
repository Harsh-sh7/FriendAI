import React, { useState, useRef, useEffect } from 'react';
import { apiHelpers } from '../utils/api';
import { Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Chat = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [usedMicrophone, setUsedMicrophone] = useState(false); // Track input method
  
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioChunksRef = useRef([]);
  const processingRef = useRef(false);

  // Function to create complete AI response text for TTS
  const createCompleteResponseText = (response) => {
    let fullText = '';
    
    if (response.summary) {
      fullText += response.summary + ' ';
    }
    
    if (response.consolation) {
      fullText += response.consolation + ' ';
    }
    
    if (response.suggestions && response.suggestions.length > 0) {
      fullText += 'Here are some suggestions for tomorrow: ';
      response.suggestions.forEach((suggestion, index) => {
        fullText += `${index + 1}. ${suggestion}. `;
      });
    }
    
    if (response.motivation) {
      fullText += response.motivation + ' ';
    }
    
    if (response.knowledgeNugget) {
      fullText += `And here's something interesting: ${response.knowledgeNugget}`;
    }
    
    return fullText.trim();
  };

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Don't use continuous mode
      recognitionRef.current.interimResults = true; // Get interim results for better UX
      recognitionRef.current.lang = 'en-US';
      
      // Add more configuration for better reliability
      recognitionRef.current.maxAlternatives = 3;
      
      console.log('Speech recognition initialized successfully');

      recognitionRef.current.onresult = (event) => {
        console.log('Speech recognition result event:', event);
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          console.log('Transcript part:', transcript, 'isFinal:', event.results[i].isFinal);
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
        
        if (finalTranscript.trim()) {
          console.log('Final transcript received:', finalTranscript);
          setTranscription(prev => {
            const current = prev || '';
            const newText = current ? current + ' ' + finalTranscript : finalTranscript;
            console.log('Setting transcription to:', newText.trim());
            return newText.trim();
          });
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.log('Speech recognition error:', event.error);
        // Handle speech recognition errors - try to continue
        if (event.error === 'network') {
          console.log('Network error - this is common and doesn\'t stop recognition');
        } else if (event.error === 'not-allowed') {
          console.log('Microphone permission denied');
          toast.error('Microphone permission denied. Please allow microphone access.');
        } else if (event.error === 'no-speech') {
          console.log('No speech detected');
        } else {
          console.log('Other speech recognition error:', event.error);
        }
      };
      
      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
      };
      
      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
      };
    } else {
      console.log('Speech recognition not supported in this browser');
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try to start speech recognition
      if (recognitionRef.current) {
        try {
          console.log('Attempting to start speech recognition...');
          recognitionRef.current.start();
          console.log('Speech recognition start command sent');
        } catch (speechError) {
          console.warn('Speech recognition failed to start:', speechError);
          toast.error('Speech recognition unavailable. Audio recording will continue.');
        }
      } else {
        console.log('Speech recognition not available');
        toast.error('Speech recognition not supported in this browser.');
      }
      
      // Start audio recording with fallback mime types
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = ''; // Use default
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        toast.error('Recording error occurred');
        setIsRecording(false);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      processingRef.current = false; // Reset processing flag
      toast.success('Recording started. Speak now!');
    } catch (error) {
      console.error('Error starting recording:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Microphone permission denied. Please allow microphone access.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No microphone found. Please connect a microphone.');
      } else {
        toast.error('Failed to start recording. Check microphone permissions.');
      }
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      
      // Wait for the recording to finish and process it
      mediaRecorderRef.current.onstop = async () => {
        if (processingRef.current) {
          return; // Prevent duplicate processing
        }
        
        processingRef.current = true;
        
        // Wait a moment for speech recognition to finish processing
        setTimeout(async () => {
          console.log('Checking transcription results...');
          
          // Check if we have any transcription from browser speech recognition
          let currentTranscription = '';
          setTranscription(current => {
            currentTranscription = current || '';
            return current;
          });
          
          console.log('Current transcription:', currentTranscription);
          
          if (currentTranscription.trim()) {
            console.log('Browser speech recognition successful!');
            setUsedMicrophone(true); // Mark that microphone was used
            toast.success('Speech recognition completed!');
          } else {
            console.log('No browser speech recognition result, trying server transcription...');
            
            if (audioChunksRef.current.length === 0) {
              toast.error('No audio recorded. Please try again.');
            } else {
              // Try server transcription as fallback
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              
              try {
                toast.loading('Using server transcription...');
                const transcribeResponse = await apiHelpers.transcribeAudio(audioBlob);
                const serverTranscription = transcribeResponse.data.transcription;
                
                console.log('Server transcription:', serverTranscription.substring(0, 50) + '...');
                
                if (serverTranscription.includes('not implemented yet')) {
                  toast.dismiss();
                  toast.error('Speech recognition failed. Please type your message manually.');
                } else {
                  setTranscription(serverTranscription);
                  setUsedMicrophone(true); // Mark that microphone was used
                  toast.dismiss();
                  toast.success('Server transcription completed!');
                }
              } catch (error) {
                console.error('Server transcription failed:', error);
                toast.dismiss();
                toast.error('Speech recognition failed. Please type your message manually.');
              }
            }
          }
          
          processingRef.current = false;
        }, 2000); // Wait 2 seconds for speech recognition to complete
      };
    }
    
    // Stop speech recognition safely
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (speechError) {
        console.warn('Error stopping speech recognition:', speechError);
      }
    }
    
    setIsRecording(false);
  };

  const handleSendMessage = async (text = textInput || transcription) => {
    if (!text.trim()) {
      toast.error('Please enter or record a message first');
      return;
    }

    // Check if user is typing (not using transcription)
    const isTyping = textInput && !transcription;
    if (isTyping) {
      setUsedMicrophone(false);
    }

    setLoading(true);
    setAiResponse(null);
    
    try {
      // Analyze the text with AI
      const response = await apiHelpers.analyzeText(text.trim());
      setAiResponse(response.data);
      
      // Generate speech for complete AI response
      try {
        const completeResponseText = createCompleteResponseText(response.data);
        const audioResponse = await apiHelpers.textToSpeech(completeResponseText);
        const audioBlob = new Blob([audioResponse.data], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Auto-play only if user used microphone
        if (usedMicrophone) {
          setTimeout(() => {
            if (url) {
              const audio = new Audio(url);
              audio.play().then(() => {
                setIsPlaying(true);
                audio.onended = () => setIsPlaying(false);
              }).catch(err => {
                console.warn('Auto-play failed:', err);
                // Fallback to manual play button
              });
            }
          }, 500); // Small delay to ensure UI is ready
        }
      } catch (ttsError) {
        console.warn('TTS failed, using browser fallback:', ttsError);
        // Auto-play browser TTS only if user used microphone
        if (usedMicrophone && response.data) {
          setTimeout(() => {
            const completeResponseText = createCompleteResponseText(response.data);
            const utterance = new SpeechSynthesisUtterance(completeResponseText);
            utterance.onstart = () => setIsPlaying(true);
            utterance.onend = () => setIsPlaying(false);
            speechSynthesis.speak(utterance);
          }, 500);
        }
      }
      
      // Clear inputs and reset microphone flag
      setTextInput('');
      setTranscription('');
      setUsedMicrophone(false);
      
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Failed to analyze message:', error);
      
      // More specific error messages
      if (error.response?.status === 429) {
        toast.error('Too many requests. Please wait a moment and try again.');
      } else if (error.response?.status === 500) {
        toast.error('Server error. The AI service might be temporarily unavailable.');
      } else if (error.code === 'NETWORK_ERROR') {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Failed to analyze your message. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const playAudio = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    } else if (aiResponse) {
      // Fallback to browser TTS with complete response
      const completeResponseText = createCompleteResponseText(aiResponse);
      const utterance = new SpeechSynthesisUtterance(completeResponseText);
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      speechSynthesis.speak(utterance);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    speechSynthesis.cancel();
    setIsPlaying(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Daily Check-in
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Share how your day went. I'm here to listen and help.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Input Section */}
        <div className="card mb-6 fade-in-up accent-dot">
          <div className="space-y-4">
            {/* Voice Recording */}
            <div className="text-center">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={loading}
                className={`p-4 rounded-full transition-all duration-300 mic-button floating ${
                  isRecording
                    ? 'bg-red-500 text-white recording-pulse'
                    : 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </button>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
              </p>
            </div>

            {/* Text Input */}
            <div className="relative">
              <textarea
                value={transcription || textInput}
                onChange={(e) => {
                  if (!transcription) {
                    setTextInput(e.target.value);
                  }
                }}
                placeholder="Or type how your day went..."
                className="w-full min-h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                disabled={loading || isRecording}
              />
              {transcription && (
                <button
                  onClick={() => setTranscription('')}
                  className="absolute top-2 right-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Send Button */}
            <div className="flex justify-center">
              <button
                onClick={() => handleSendMessage()}
                disabled={loading || (!textInput && !transcription) || isRecording}
                className="btn-primary px-8 py-3 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 loading-spinner"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send to AI Friend</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* AI Response */}
        {aiResponse && (
          <div className="card fade-in-up gentle-float accent-dot">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Your AI Friend's Response
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={isPlaying ? stopAudio : playAudio}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Summary */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Summary</h4>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {aiResponse.summary}
                </p>
              </div>

              {/* Consolation */}
              {aiResponse.consolation && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Support</h4>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {aiResponse.consolation}
                  </p>
                </div>
              )}

              {/* Suggestions */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Suggestions for Tomorrow</h4>
                <ul className="space-y-2">
                  {aiResponse.suggestions?.map((suggestion, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-gray-400 dark:text-gray-500 mt-1">•</span>
                      <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mood Score */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="font-medium text-gray-900 dark:text-gray-100">Mood Score</span>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {aiResponse.moodScore}/10
                  </span>
                  <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-900 dark:bg-gray-100 transition-all duration-300"
                      style={{ width: `${(aiResponse.moodScore / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Motivation */}
              <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Motivation</h4>
                <p className="text-gray-700 dark:text-gray-300 italic">
                  "{aiResponse.motivation}"
                </p>
              </div>

              {/* Knowledge Nugget */}
              {aiResponse.knowledgeNugget && (
                <div className="border-l-4 border-gray-300 dark:border-gray-600 pl-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">💡 Did You Know?</h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    {aiResponse.knowledgeNugget}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audio element for TTS */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            style={{ display: 'none' }}
          />
        )}
      </div>
    </div>
  );
};

export default Chat;

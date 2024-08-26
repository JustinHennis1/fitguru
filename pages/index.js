import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import styles from '@/styles/Home.module.css';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useRouter } from 'next/router';
import Head from 'next/head';


const popularQuestions = [
  "When should I take protein supplements for optimal muscle growth?",
  "How often should I take fish oil or omega-3 supplements, and what are the benefits?",
  "Are multivitamins necessary for someone with a balanced diet?",
  "When should you take creatine for optimal performance and muscle growth?",
  "Is creatine safe for teens?",
  "How does caffeine affect workout performance?",
  "Are pre-workout supplements necessary for improving performance?"
];

export default function Home() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hi there! Thanks for reaching out to FitGuru Support. What can I help you with today?"
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isQuestionsOpen, setIsQuestionsOpen] = useState(typeof window !== 'undefined' && window.innerHeight >= 500);
  const [isYouTubeActive, setIsYouTubeActive] = useState(false);
  const messagesEndRef = useRef(null);
  const router = useRouter();
  const [commandSuggestions, setCommandSuggestions] = useState([]); 
  const availableCommands = ['@youtube'];
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    //console.log("isYouTubeActive: ", isYouTubeActive);
  }, [isYouTubeActive]);

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
  
    //console.log("User input:", input);
  
    const command = input.split(' ')[0];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urlMatch = input.match(urlRegex);
    const restofinput = input.slice(command.length).trim();
  
    if (command.toLowerCase() === '@youtube' && !isYouTubeActive) {
      setIsYouTubeActive(true);
      setInput('');
      return;
    }
  
    if (isYouTubeActive) {
      if (urlMatch) {
        await processVideo(urlMatch[0]);
      } else {
        await sendMessage(input, '/api/askQuestion');
      }
    } else {
      await sendMessage(input);
    }
  
    setInput('');
  };

  const sendMessage = async (content, apiEndpoint = '/api/chat') => { // Default to chat API
    const userMessage = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    //console.log(userMessage);

    try {
        const response = await fetch(apiEndpoint, { // Use the provided API endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: apiEndpoint === '/api/chat' ? JSON.stringify({ messages: [...messages, userMessage] }) : JSON.stringify({ question: content }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        //console.log(data);
        setMessages(prev => [...prev, { role: 'assistant', content: data.message}]);
    } catch (error) {
        console.error('Error:', error);
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, there was an error processing your request.' }]);
    } finally {
        setIsLoading(false);
    }
  };

  const processVideo = async (videoUrl) => {
    try {   
      setIsLoading(true);
      const response = await fetch('/api/processVideo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl }),
      });
   
      const data = await response.json();
      setIsLoading(false);
      if (response.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
        setIsYouTubeActive(true);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error }]);
      }
    } catch (error) {
      console.error('Error processing video:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error processing video.' }]);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleInputChange = (e) => {
    const newInput = e.target.value;
    setInput(newInput);

    if (newInput.startsWith('@')) {
      const command = newInput.split(' ')[0];
      const suggestions = availableCommands.filter(cmd => cmd.startsWith(command));
      setCommandSuggestions(suggestions);
    } else {
      setCommandSuggestions([]);
    }
  };

  const handleCommandClick = (command) => {
    if(command === '@youtube'){
      setIsYouTubeActive(true);
    }
    setInput('');
    setCommandSuggestions([]);
  };

  const handleDeactivateYouTube = () => {
    setIsYouTubeActive(false);
  };

  const ActiveCommandBox = ({ command, onDeactivate }) => (
    <div className={styles.activeCommandBox}>
      <span>{command}</span>
      <button
        className={styles.deactivateButton}
        onClick={onDeactivate}
        title="Deactivate command"
      >
        ×
      </button>
    </div>
  );

  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >

      <Head>
        <title>FitGuru Chat Support</title>
        <meta name="description" content="Get expert support for your fitness journey with FitGuru." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className={styles.main}>
        <div className={styles.headerContainer}>
          <h1 className={styles.header}>FitGuru Chat Support</h1>
          <motion.button 
            className={styles.logoutButton}
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Logout
          </motion.button>
        </div>
        <div className={styles.popularQuestions}>
          <div 
            className={styles.popularQuestionsHeader}
            onClick={() => setIsQuestionsOpen(!isQuestionsOpen)}
          >
            <h2>Popular Questions</h2>
            <motion.button
              className={`${styles.collapseButton} ${isQuestionsOpen ? styles.open : ''}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ▼
            </motion.button>
          </div>
          <AnimatePresence>
            {isQuestionsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {popularQuestions.map((question, index) => (
                  <motion.button
                    key={index}
                    className={styles.questionButton}
                    onClick={() => sendMessage(question)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {question}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <motion.div 
          className={styles.chatContainer}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {messages.map((msg, index) => (
            <motion.div 
              key={index} 
              className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.botMessage}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ReactMarkdown components={{
                p: ({node, ...props}) => <p style={{marginBottom: '10px'}} {...props} />,
                ul: ({node, ...props}) => <ul style={{paddingLeft: '20px', marginBottom: '10px'}} {...props} />,
                ol: ({node, ...props}) => <ol style={{paddingLeft: '20px', marginBottom: '10px'}} {...props} />,
                li: ({node, ...props}) => <li style={{marginBottom: '5px'}} {...props} />
              }}>
                {msg.content}
              </ReactMarkdown>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </motion.div>
        <div className={styles.inputSection}>

        {commandSuggestions.length > 0 && (
          <motion.div 
            className={styles.commandSuggestionsRow}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {commandSuggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                onClick={() => handleCommandClick(suggestion)}
                className={styles.commandSuggestion}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {suggestion}
              </motion.button>
            ))}
          </motion.div>
        )}
        <div className={styles.row}>
        {isYouTubeActive && (
          <ActiveCommandBox 
            command="@youtube"
            onDeactivate={handleDeactivateYouTube}
          />
        )}
        <form onSubmit={handleSubmit} className={styles.inputContainer}>
          <motion.input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className={styles.input}
            disabled={isLoading}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          />
        </form>
        </div>
      </div>
      </main>
    </motion.div>
  );
}
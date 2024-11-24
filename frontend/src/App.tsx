 
import { useEffect, useRef, useState } from 'react';
import Input from './components/Input';

function App() { 
  const [input, setInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{ message: string, isUser: boolean }>>([]);
  const welcomeMessageSent = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();

    if (input.trim() === '') return;

    setChatHistory([
      ...chatHistory,
      { message: input, isUser: true }
    ]);

    setChatHistory((prevChatHistory) => [
      ...prevChatHistory,
      { message: `You asked about: ${input}!`, isUser: false }
    ]);

    setInput('');
  };

  useEffect(() => {
    if (!welcomeMessageSent.current) {
      setChatHistory((prevChatHistory) => [
        ...prevChatHistory,
        { message: "Hello! I can help you find book recommendations based on genres. Type a genre to get started!", isUser: false }
      ]);
      welcomeMessageSent.current = true;  
    }
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]); 

  return (
  <div className="flex flex-col h-screen bg-[#2e223c]">
  <div 
   ref={chatContainerRef} 
  className="flex-grow p-4 overflow-auto space-y-4 no-scrollbar">
    {chatHistory.map((message, index) => (
      <div
        key={index}
        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-xs p-3 rounded-lg ${message.isUser ? 'bg-[#3c2c4d] text-white' : 'bg-gray-200'}`}
        >
          {message.message}
        </div>
      </div>
    ))}
  </div>
  <div className="p-4 pt-0"> 
    <Input
    value={input}
          onChange={handleInputChange}
          onSubmit={handleSend}/>
  </div>
</div>
  )
}

export default App

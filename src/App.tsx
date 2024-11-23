 
import { useState } from 'react';
import Input from './components/Input';

function App() { 
  const [input, setInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{ message: string, isUser: boolean }>>([]);

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
  return (
  <div className="flex flex-col h-screen bg-[#2e223c]">
  <div className="flex-grow p-4 overflow-auto space-y-4">
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
  <div className="p-4 "> 
    <Input
    value={input}
          onChange={handleInputChange}
          onSubmit={handleSend}/>
  </div>
</div>
  )
}

export default App

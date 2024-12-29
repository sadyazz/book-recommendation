import { useEffect, useRef, useState } from 'react';
import Input from './components/Input';
import axios from 'axios';
import BookMessage from './components/BookMessage'; 
import { BsFileBarGraph } from "react-icons/bs"; 
import { IoClose } from "react-icons/io5";

function App() { 
  const [input, setInput] = useState<string>(''); 
  const [chatHistory, setChatHistory] = useState<Array<{ message: string | JSX.Element, isUser: boolean }>>([]); 
  const [books, setBooks] = useState<Array<any>>([]); 
  const [currentBookIndex, setCurrentBookIndex] = useState<number>(0); 
  const [isLoading, setIsLoading] = useState<boolean>(false); 
  const [sessionId, setSessionId] = useState<string | null>(null);
  const welcomeMessageSent = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [graph, setGraph] = useState<string | null>(null);
const [showGraph, setShowGraph] = useState(false);


  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };
  
  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (input.trim() === '' || isLoading) return;
    
    setInput('');
    setCurrentBookIndex(0);
    
    setChatHistory((prevChatHistory) => [
      ...prevChatHistory,
      { message: input, isUser: true },
    ]);
    
    setIsLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/start', { genre: input.trim().toLowerCase() });
      setIsLoading(false);
  
      if (response.data && response.data.session_id) {
        const session_id = response.data.session_id;
        console.log("session_id je ", session_id);
        setSessionId(session_id);
  
        setBooks([response.data]);
        setChatHistory((prev) => [
          ...prev,
          {
            message: (
              <BookMessage
                title={response.data.book}
                author={response.data.author}
                genres={response.data.genres}
                onDislike={() => handleDislike(session_id)}
                onLike={() => handleLike(session_id)}
              />
            ),
            isUser: false,
          },
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          { message: `No books in the ${input} genre.`, isUser: false },
        ]);
      }
    } catch (error) {
      setIsLoading(false);
      setChatHistory((prev) => [
        ...prev,
        { message: 'Error loading books, please try again.', isUser: false },
      ]);
    }
  };
  

const handleLike = async (sessionId: string) => {
  if (!sessionId) return;
  setIsLoading(true);

  try {
    const response = await axios.post('http://localhost:5000/recommend', {
      session_id: sessionId,
      reaction: "👍",
    });
    console.log("like response", response);
setIsLoading(false);
    if (response.data) {
      setBooks((prevBooks) => [...prevBooks, response.data]);
      setChatHistory((prev) => [
        ...prev,
        {
          message: (
            <BookMessage
              title={response.data.book}
              author={response.data.author}
              genres={response.data.genres}
              onDislike={() => handleDislike(sessionId)}
              onLike={() => handleLike(sessionId)}
            />
          ),
          isUser: false,
        },
      ]);
    }
  } catch (error) {
    console.error("Error while liking the book:", error);
    setChatHistory((prev) => [
      ...prev,
      { message: "Error fetching the next recommendation.", isUser: false },
    ]);
  }
};

const handleDislike = async (sessionId: string) => {
  if (!sessionId) return;
setIsLoading(true);
  try {
    const response = await axios.post('http://localhost:5000/recommend', {
      session_id: sessionId,
      reaction: "👎",
    });
    console.log("dislike response je ", response)
setIsLoading(false);
    if (response.data) {
      setBooks((prevBooks) => [...prevBooks, response.data]);
      setChatHistory((prev) => [
        ...prev,
        {
          message: (
            <BookMessage
              title={response.data.book}
              author={response.data.author}
              genres={response.data.genres}
              onDislike={() => handleDislike(sessionId)}
              onLike={() => handleLike(sessionId)}
            />
          ),
          isUser: false,
        },
      ]);
    }
  } catch (error) {
    console.error("Error while disliking the book:", error);
    setChatHistory((prev) => [
      ...prev,
      { message: "Error fetching the next recommendation.", isUser: false },
    ]);
  }
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
        className="flex-grow p-4 overflow-auto space-y-4 no-scrollbar scroll-smooth"
      >
        {chatHistory.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
             {!message.isUser && (
              <div className="flex-shrink-0 mr-3"> 
                <img 
                  src="src\assets\bb8.png" 
                  alt="Agent" 
                  className="w-7 h-7 rounded-full object-cover"
                />
              </div>
            )}
            <div
              className={`w-fit p-3 rounded-lg ${message.isUser ? 'bg-[#3c2c4d] text-white' : ' text-white border border-white p-4 rounded-xl'}`}
            > 
              {typeof message.message === 'string' ? message.message : <div>{message.message}</div>}
            </div>
          </div>
        ))}
         {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-xs p-3 text-white text-5xl">
              <span className="loading-dots">.</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 pt-0">
        <Input
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSend}
        />
      </div>
    </div>
  );
}

export default App;

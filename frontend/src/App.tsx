import { useEffect, useRef, useState } from 'react';
import Input from './components/Input';
import axios from 'axios';
import BookMessage from './components/BookMessage'; 
import { FaBook } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

type BookRecommendation = {
  book: string;
  author: string;
  description: string;
  genres: string[];
};

function App() { 
  const [input, setInput] = useState<string>(''); 
  const [chatHistory, setChatHistory] = useState<Array<{ message: string | JSX.Element, isUser: boolean }>>([]); 
  const [books, setBooks] = useState<Array<any>>([]); 
  const [currentBookIndex, setCurrentBookIndex] = useState<number>(0); 
  const [isLoading, setIsLoading] = useState<boolean>(false); 
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [topRecommendations, setTopRecommendations] = useState<BookRecommendation[] | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const welcomeMessageSent = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const topRecommendationsRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

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
      console.log("dislike response je ", response);
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

  const fetchTopRecommendations = async () => {
    if (!sessionId) {
      setChatHistory((prev) => [
        ...prev,
        { message: "Please send a genre first.", isUser: false },
      ]);
      return;
    }
  
    setIsLoading(true);
  
    try {
      const response = await axios.post('http://localhost:5000/top_recommendations', { session_id: sessionId });
  
      const recommendations = response.data.recommendations;
      if (recommendations && recommendations.length > 0) {
        setTopRecommendations(recommendations);
        setShowRecommendations(true);
      } else {
        setChatHistory((prev) => [
          ...prev,
          { message: "There are no recommendations available yet. Try liking or disliking more books.", isUser: false },
        ]);
      }
    } catch (error) {

      console.error("Error fetching top recommendations:", error);
  
      setChatHistory((prev) => [
        ...prev,
        { message: "An error occurred while loading recommendations. Please try again later.", isUser: false },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        topRecommendationsRef.current && 
        !topRecommendationsRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowRecommendations(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#2e223c] md:px-10 lg:px-30 xl:px-40 2xl:px-52">
      <button
        ref={buttonRef}
        onClick={fetchTopRecommendations}
        className="p-2 rounded-full absolute top-4 right-4 z-10 bg-[#47355c]"
      >
        <FaBook className='text-white'/>
      </button>

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
              className={`w-fit p-3 rounded-lg ${message.isUser ? 'bg-[#3c2c4d] text-white md:text-base text-sm' : ' text-white border border-white rounded-xl'}`}
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

      {showRecommendations && topRecommendations && (
  <div 
    ref={topRecommendationsRef} 
    className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white md:pt-2.5 md:pb-5 md:p-8 px-4 rounded-2xl shadow-xl z-50 max-w-lg lg:w-full w-[90%] overflow-y-auto">
    <button
      onClick={() => setShowRecommendations(false)}
      className="absolute top-2 right-2 p-2 text-black"
    >
      <IoClose className="text-2xl" />
    </button>
    
    <div className="mt-6">
      <h2 className="md:text-2xl text-xl font-semibold mb-4 text-center text-gray-800">Recommendations</h2>
      <ul className="md:space-y-6">
        {topRecommendations.map((recommendation, index) => (
          <li 
            key={index} 
            className={`pb-4 ${index !== topRecommendations.length - 1 ? 'border-b' : ''}`}
          >
            <h3 className="md:text-xl text-lg font-bold text-gray-800">{recommendation.book}</h3>
            <p className="text-gray-600 italic">{recommendation.author}</p>
            <div className="mt-2">
              <div className="space-x-2 mt-2 flex flex-wrap">
                {recommendation.genres.map((genre, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 md:text-xs text-[13px] rounded-full bg-[#6b4c9c] text-white"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </div>
)}
      <div className="p-4 pt-0 flex justify-center">
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

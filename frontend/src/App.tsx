import { useEffect, useRef, useState } from 'react';
import Input from './components/Input';
import axios from 'axios';
import BookMessage from './components/BookMessage';  

function App() { 
  const [input, setInput] = useState<string>('');
   
  const [chatHistory, setChatHistory] = useState<Array<{ message: string | JSX.Element, isUser: boolean }>>([]); 

  const [genres, setGenres] = useState<string[]>([]);  
  const [books, setBooks] = useState<Array<any>>([]); 
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const welcomeMessageSent = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();

    if (input.trim() === '') return;

    setInput('');   

 
    setChatHistory(prevChatHistory => [
      ...prevChatHistory,
      { message: input, isUser: true }
    ]);

    setIsLoading(true);

    try { 
      const response = await axios.get(`http://127.0.0.1:5000/api/books?genre=${input.trim().toLowerCase()}`);

      setIsLoading(false);

      if (response.data && response.data.length > 0) { 
        setChatHistory(prev => [
          ...prev,
          { message: `Found books for genre: ${input}`, isUser: false }
        ]);
 
        response.data.forEach((book: any) => {
          setChatHistory(prev => [
            ...prev,
            {
              message: <BookMessage 
                          title={book.title} 
                          author={book.authors.map((author: any) => author.name)} 
                        />,
              isUser: false
            }
          ]);
        });
      } else { 
        setChatHistory(prev => [
          ...prev,
          { message: `No books found for genre: ${input}`, isUser: false }
        ]);
      }

    } catch (error) {
      setIsLoading(false); 
      setChatHistory(prev => [
        ...prev,
        { message: "Error fetching books, please try again later.", isUser: false }
      ]);
    }

    // setInput('');   
  };

  useEffect(() => { 
    const fetchGenres = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/genres');
        setGenres(response.data);
      } catch (error) {
        console.error('Error fetching genres', error);
      }
    };

    fetchGenres();

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
              className={`max-w-xs p-3 rounded-lg ${message.isUser ? 'bg-[#3c2c4d] text-white' : ' text-white border border-white p-4 rounded-xl'}`}
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

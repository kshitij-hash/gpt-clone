"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { GoArrowUp } from "react-icons/go";
import { useEffect, useRef, useState } from "react";
import { redirect } from "next/navigation";

const MODEL_NAME = "gemini-1.0-pro";
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;


export default function Home() {
  const [data, setData] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: user } = await supabase.auth.getUser();

      if(!user) {
        return redirect("/signin");
      }
    }
    checkUser();
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    const fetchChatHistory = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const userId = user.id;

        const { data: chats, error: chatsError } = await supabase
          .from('chats')
          .select('chat_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })


        if (chatsError) {
          console.error("Error fetching chat:", chatsError);
          return;
        }

        if (chats && chats.length > 0) {
          const chatId = chats[0].chat_id;
          setCurrentChatId(chatId);

          const { data: messages, error: messagesError } = await supabase
            .from('message')
            .select('sender, message')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });

          if (messagesError) {
            console.error("Error fetching messages:", messagesError);
            return;
          }

          const chatHistory = messages.map(msg => ({
            role: msg.sender,
            text: msg.message,
          }));

          setChatHistory(chatHistory);
        }
      }
    };

    fetchChatHistory();
  }, [currentChatId]);

  async function runChat(prompt: string) {
    const chatId = currentChatId;
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: [
        {
          role: "user",
          parts: [{ text: "HELLO" }],
        },
        {
          role: "model",
          parts: [{ text: "Hello there! How can I assist you today?" }],
        },
      ],
    });

    const result = await chat.sendMessage(prompt);
    const response = result.response;
    setChatHistory(
      [...chatHistory, { role: 'user', text: prompt }, { role: 'model', text: response.text() }]
    );
    setData(response.text());

    const supabase = createClient();
    const userId = (await (supabase.auth.getUser())).data.user?.id;

    if(!chatId) {
      console.log('creating chat');
      const chat = {
        user_id: userId,
      }
      const {
        data: chatData,
        error: chatError
      } = await supabase.from('chats').insert(chat);

      if(chatError) {
        console.error('error inserting chat', chatError);
        return;
      }

      const chatIdData = await supabase.from('chats').select('chat_id').eq('user_id', userId)
      console.log(chatIdData);
    }

    const userMessage = {
      chat_id: chatId,
      user_id: userId,
      message: prompt,
      sender: 'user'
    }
    const {
      data: userMessageData,
      error: userMessageError
    } = await supabase.from('message').insert(userMessage);

    if(userMessageError) {
      console.error('error inserting user message', userMessageError);
      return;
    }

    const aiMessage = {
      chat_id: chatId,
      user_id: userId,
      message: response.text(),
      sender: 'ai'
    }
    const {
      data: aiMessageData,
      error: aiMessageError
    } = await supabase.from('message').insert(aiMessage);

    if(aiMessageError) {
      console.error('error inserting ai message', aiMessageError);
      return;
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = (event.target as HTMLFormElement)?.prompt?.value;
    if(prompt) {
      setInputValue('');
      runChat(prompt);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const prompt = event.currentTarget.value.trim();
      if (prompt) {
        setInputValue('');
        runChat(prompt);
      }
    }
  };

  return (
    <main className="flex flex-col items-center justify-between min-h-[92vh] p-6">
      <div className="flex flex-col w-full max-w-3xl p-4 space-y-4 overflow-auto h-full pb-20">
        {chatHistory.map((item, index) => (
          <div key={index} className={`flex ${item.role === 'user' ? 'self-end' : 'self-start'} p-4 rounded-lg ${item.role === 'user' ? 'bg-gray-100 dark:bg-gray-800' : 'bg-gray-200 dark:bg-gray-700'}`}>
            <p className="text-sm">{item.text}</p>
          </div>
        ))}
        <div ref={chatEndRef}></div>
      </div>
      <form onSubmit={onSubmit} className="rounded-full fixed bottom-1 flex w-full max-w-3xl p-4">
        <Input
          type="text"
          placeholder="Message ChatGPT"
          name="prompt"
          className="flex-1 p-4 mr-2 border rounded-lg outline-none"
          onKeyDown={handleKeyPress}
          onChange={handleInputChange}
          value={inputValue}
        />
        <Button
          type="submit"
          className="p-3 text-sm rounded-full"
          disabled={!inputValue.trim()}
        >
          <GoArrowUp />
        </Button>
      </form>
    </main>
  );
}
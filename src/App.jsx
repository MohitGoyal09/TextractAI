import './App.css'
import React, { useState } from 'react';
import { Button } from './components/ui/button'
import { Textarea } from "@/components/ui/textarea"
import { Upload } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import * as pdfjsLib from 'pdfjs-dist'
import { GoogleGenerativeAI } from '@google/generative-ai';

// Set up the worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();




// For production, use environment variables
const API_KEY = 'AIzaSyD9uxzpAb2Qj9TITjjV1WYzqV9uuZRfPhQ'




function App() {
  const [summary, setSummary] = useState('');
  const [pdfText, setPdfText] = useState(null);
  const [apiKey, setApiKey] = useState(API_KEY);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsLoading(true);
      try {
        const text = await extractPdfText(file);
        console.log('Extracted PDF text:', text);
        setPdfText(text);
      } catch (error) {
        console.error('Error extracting PDF text:', error);
        setSummary('Error extracting PDF text. Please try another file.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const extractPdfText = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + ' ';
    }
    return text.trim();
  };

  const summarizeText = async () => {
    if (!apiKey) {
      setSummary('Error: API key is not set. Please enter your API key.');
      return;
    }

    if (!pdfText) {
      setSummary('Error: No PDF text to summarize. Please upload a PDF first.');
      return;
    }

    setIsLoading(true);
    console.log("PDF text to summarize:", pdfText);
    console.log("API Key:", apiKey);

    const genAi = new GoogleGenerativeAI(apiKey);
    const model = genAi.getGenerativeModel({ model: "gemini-pro" });
    
    try {
      const result = await model.generateContent(`Summarize the following text: ${pdfText}`);
      console.log("API Response:", result);
      const response = await result.response;
      const summary = response.text();
      setSummary(summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary('An error occurred while generating the summary. Please check the console for more details.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className='container mx-auto p-4'>
      <h1 className='font-bold text-2xl mb-4'>PDF Summarizer</h1>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>API Key</CardTitle>
        </CardHeader>
        <CardContent>
          <Input 
            type="text" 
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
            aria-label="API Key Input"
          />
        </CardContent>
      </Card>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Upload PDF</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileUpload} 
              disabled={isLoading}
              aria-label="Upload PDF file"
            />
            <Button disabled={isLoading}>
              <Upload className="mr-2 h-4 w-4" /> Upload
            </Button>
          </div>
        </CardContent>
      </Card>
      <Button 
        onClick={summarizeText} 
        className="mb-4" 
        disabled={isLoading || !pdfText}
      >
        {isLoading ? 'Processing...' : 'Summarize'}
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea 
            value={summary} 
            readOnly 
            placeholder="Summary will appear here..." 
            className='min-h-[200px]'
            aria-label="Summary Output"
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default App

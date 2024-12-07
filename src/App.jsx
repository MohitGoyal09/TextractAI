import "./App.css";
import { useState, useRef } from "react";
import { Button } from "./components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X } from "lucide-react";
import { FaGithub } from "react-icons/fa"; // Import GitHub icon
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import * as pdfjsLib from "pdfjs-dist";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Set up the worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

const API_KEY = String(import.meta.env.VITE_GEMINI_API_KEY);

function App() {
  const [summary, setSummary] = useState("");
  const [pdfText, setPdfText] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setIsLoading(true);
      try {
        const text = await extractPdfText(file);
        console.log("Extracted PDF text:", text);
        setPdfText(text);
      } catch (error) {
        console.error("Error extracting PDF text:", error);
        setSummary("Error extracting PDF text. Please try another file.");
        setSelectedFile(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const extractPdfText = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str).join(" ") + " ";
    }
    return text.trim();
  };

  const summarizeText = async () => {
    if (!API_KEY) {
      setSummary("API key is not set. Please enter your API key.");
      return;
    }

    if (!pdfText) {
      setSummary("Error: No PDF text to summarize. Please upload a PDF first.");
      return;
    }

    setIsLoading(true);
    console.log("PDF text to summarize:", pdfText);

    const genAi = new GoogleGenerativeAI(API_KEY);
    const model = genAi.getGenerativeModel({ model: "gemini-pro" });

    try {
      const result = await model.generateContent(
        `Summarize the following text: ${pdfText}`
      );
      console.log("API Response:", result);
      const response = await result.response;
      const summary = response.text();
      setSummary(summary);
    } catch (error) {
      console.error("Error generating summary:", error);
      setSummary(
        "An error occurred while generating the summary. Please check the console for more details."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const clearFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear the file input
    }
    setSelectedFile(null);
    setPdfText(null);
    setSummary("");
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="App-title">PDF Summarizer</h1>
        <a
          href="https://github.com/MohitGoyal09"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub Profile"
          className="github-icon"
        >
          <FaGithub size={30} />
        </a>
      </header>

      <main>
        <div className="container mx-auto p-4">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Upload PDF</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                  aria-label="Upload PDF file"
                  ref={fileInputRef}
                  className="hidden"
                />
                <Input
                  type="text"
                  placeholder="Choose PDF file"
                  value={selectedFile ? selectedFile.name : ""}
                  readOnly
                  className="flex-grow"
                />
                <Button
                  onClick={handleButtonClick}
                  disabled={isLoading}
                  variant="outline"
                >
                  <Upload className="mr-2 h-4 w-4" /> Browse
                </Button>
                {selectedFile && (
                  <Button onClick={clearFile} variant="destructive" size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          <Button
            onClick={summarizeText}
            className="mb-4"
            disabled={isLoading || !pdfText}
          >
            {isLoading ? "Processing..." : "Summarize"}
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
                className="min-h-[200px]"
                aria-label="Summary Output"
              />
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="App-footer">
        <p>
          &copy; {new Date().getFullYear()} Made by Mohit . All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default App;

import "./App.css";
import { useState, useRef } from "react";
import { Button } from "./components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FaUpload, FaTimes } from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import * as pdfjsLib from "pdfjs-dist";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Header from "./components/Header"; // Import Header
import Footer from "./components/Footer"; // Import Footer

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
  const [summaryLength, setSummaryLength] = useState("medium"); // Added state for summary length

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
    if (!pdfText) return; // Prevent summarizing without text
    setIsLoading(true);
    setSummary("Generating summary..."); // Provide immediate feedback

    const genAi = new GoogleGenerativeAI(API_KEY);
    const model = genAi.getGenerativeModel({ model: "gemini-pro" });

    try {
      const prompt = `Summarize the following text in a ${summaryLength} length: ${pdfText}`;
      const result = await model.generateContent(prompt);
      console.log("API Response:", result);
      const response = await result.response;
      const summaryText = response.text();
      setSummary(summaryText);
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
      fileInputRef.current.value = "";
    }
    setSelectedFile(null);
    setPdfText(null);
    setSummary("");
  };

  const handleSummaryLength = (length) => {
    setSummaryLength(length);
  };

  return (
    <div className="app">
      {" "}
      {/* Changed className to lowercase */}
      <Header />
      <main className="app-main">
        {" "}
        {/* Added a main container */}
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
                  <FaUpload className="mr-2 h-4 w-4" /> Browse
                </Button>
                {selectedFile && (
                  <Button onClick={clearFile} variant="destructive" size="icon">
                    <FaTimes className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          <div className="mb-4">
            <div className="px-1 py-2 font-bold">
              How much longer summary do you want?
            </div>
            <div className="flex space-x-2">
              <Button
                className={`px-4 ${
                  summaryLength === "long"
                    ? "bg-primary text-primary-foreground hover:bg-primary/80"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
                onClick={() => handleSummaryLength("long")}
                disabled={isLoading || !pdfText}
              >
                Long
              </Button>
              <Button
                className={`px-4 ${
                  summaryLength === "medium"
                    ? "bg-primary text-primary-foreground hover:bg-primary/80"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
                onClick={() => handleSummaryLength("medium")}
                disabled={isLoading || !pdfText}
              >
                Medium
              </Button>
              <Button
                className={`px-4 ${
                  summaryLength === "short"
                    ? "bg-primary text-primary-foreground hover:bg-primary/80"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
                onClick={() => handleSummaryLength("short")}
                disabled={isLoading || !pdfText}
              >
                Short
              </Button>
            </div>
          </div>
          <Button
            onClick={summarizeText}
            className="mb-4 w-full" // Make the summarize button full width
            disabled={isLoading || !pdfText}
            isLoading={isLoading} // Use shadcn-ui's isLoading prop for visual feedback
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
                className="min-h-[200px] w-full resize-none" // Make textarea full width and disable resize
                aria-label="Summary Output"
              />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;

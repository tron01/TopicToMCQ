import { useState } from "react";
import axios from "axios";
import { GEMINI_API_KEY, GEMINI_API_URL } from "../config";
import { CSVLink } from "react-csv";

const TopicToMCQ = () => {
    const [topic, setTopic] = useState("");
    const [mcqDataset, setMcqDataset] = useState([]);
    const [jsonDataset, setJsonDataset] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]);
    const [testStarted, setTestStarted] = useState(false);

    const fetchMCQs = async () => {
        if (!topic.trim()) {
            alert("Please enter a topic");
            return;
        }
    
        setLoading(true);
    
        try {
            const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                contents: [
                    {
                        parts: [
                            {
                                text: `Generate 100 multiple-choice questions (MCQs) in JSON format for the topic: ${topic}. The structure should be:
                                {
                                    "question": "Sample question?",
                                    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                                    "answer": "Correct option"
                                }`
                            },
                        ],
                    },
                ],
            });
    
            console.log("API Response:", response.data);
    
            const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
            if (!rawText) {
                throw new Error("API returned empty response");
            }
    
            console.log("Raw Text:", rawText);
    
            // Clean JSON if needed
            const cleanJson = rawText.replace(/```json|```/g, "").trim();
    
            try {
                let mcqsArray = JSON.parse(cleanJson);
                console.log("MCQs Array:", mcqsArray);
    
                // Convert "options" array to separate fields
                mcqsArray = mcqsArray.map((mcq) => ({
                    question: mcq.question,
                    optionA: mcq.options[0],
                    optionB: mcq.options[1],
                    optionC: mcq.options[2],
                    optionD: mcq.options[3],
                    answer: mcq.answer || ""
                }));
    
                setMcqDataset(mcqsArray);
                setJsonDataset(JSON.stringify(mcqsArray, null, 2));
                console.log("Transformed MCQs:", mcqsArray);
            } catch (parseError) {
                console.error("JSON Parsing Error:", parseError.message);
                alert("Failed to parse JSON. Please check API response.");
                setMcqDataset([]);
                setJsonDataset(null);
            }
        } catch (error) {
            console.error("Error fetching MCQs:", error.response?.data || error.message);
            setMcqDataset([]);
            setJsonDataset(null);
        } finally {
            setLoading(false);
        }
    };
    
    

    const startTest = () => {
        setTestStarted(true);
        setCurrentQuestion(0);
        setScore(0);
        setUserAnswers([]);
    };

    const handleAnswer = (selectedOption) => {
        const correctAnswer = mcqDataset[currentQuestion].answer.trim();
        if (selectedOption.trim() === correctAnswer) {
            setScore(score + 1);
        }
        setUserAnswers([...userAnswers, selectedOption]);
        if (currentQuestion + 1 < mcqDataset.length) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            alert(`Test completed! Your score: ${score + (selectedOption.trim() === correctAnswer ? 1 : 0)} / ${mcqDataset.length}`);
            setTestStarted(false);
        }
    };
    
    return (
        <div className="container d-flex flex-column align-items-center justify-content-center vh-100">
            <div className="card p-4 shadow-lg" style={{ width: "40rem" }}>
                <h2 className="text-center mb-3">Topic-Based MCQ Generator</h2>
                {!testStarted ? (
                    <>
                        <input
                            type="text"
                            className="form-control mb-3"
                            placeholder="Enter Topic"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                        <button className="btn btn-primary w-100" onClick={fetchMCQs} disabled={loading}>
                            {loading ? "Generating..." : "Get MCQs"}
                        </button>
                        {mcqDataset.length > 0 && (
                            <>
                                <CSVLink 
                                    data={mcqDataset} 
                                    filename={`${topic}_MCQs.csv`} 
                                    className="btn btn-success w-100 mt-3"
                                >
                                    Download MCQs CSV
                                </CSVLink>
                                <button className="btn btn-secondary w-100 mt-3" onClick={startTest}>
                                    Start Test
                                </button>
                            </>
                        )}
                    </>
                ) : (
                    <div>
                        <h4>{mcqDataset[currentQuestion].question}</h4>
                        <div className="list-group">
                            {['optionA', 'optionB', 'optionC', 'optionD'].map((opt) => (
                                <button key={opt} className="list-group-item list-group-item-action" onClick={() => handleAnswer(mcqDataset[currentQuestion][opt])}>
                                    {mcqDataset[currentQuestion][opt]}
                                </button>
                            ))}
                        </div>
                        <p className="mt-3">Question {currentQuestion + 1} of {mcqDataset.length}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopicToMCQ;
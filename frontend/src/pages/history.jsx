import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import { IconButton, Button } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EventIcon from '@mui/icons-material/Event';
import CodeIcon from '@mui/icons-material/Code';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [expandedMeeting, setExpandedMeeting] = useState(null); 
    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch (e) {
                console.error("Failed to fetch history:", e);
            }
        }
        fetchHistory();
    }, [getHistoryOfUser])

    let formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    const toggleExpand = (id) => {
        if (expandedMeeting === id) {
            setExpandedMeeting(null);
        } else {
            setExpandedMeeting(id);
        }
    };

    const parseBold = (content) => {
        const boldParts = content.split(/\*\*(.*?)\*\*/g);
        return boldParts.map((part, index) => {
            if (index % 2 === 1) {
                return <strong key={index} style={{ color: "#a5f3fc", fontWeight: '700' }}>{part}</strong>;
            }
            return part;
        });
    };

    const renderMarkdown = (text) => {
        if (!text) return <Typography style={{ color: '#94a3b8' }}>No summary generated for this meeting.</Typography>;
        
        const lines = text.split("\n");
        return lines.map((line, idx) => {
            if (line.startsWith("# ")) {
                return <h1 key={idx} style={{ color: "#00e5ff", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "6px", marginTop: "16px", marginBottom: "12px", fontSize: "1.5rem" }}>{line.substring(2)}</h1>;
            }
            if (line.startsWith("## ")) {
                return <h2 key={idx} style={{ color: "#c084fc", marginTop: "14px", marginBottom: "8px", fontSize: "1.25rem" }}>{line.substring(3)}</h2>;
            }
            if (line.startsWith("### ")) {
                return <h3 key={idx} style={{ color: "#f472b6", marginTop: "12px", marginBottom: "6px", fontSize: "1.1rem" }}>{line.substring(4)}</h3>;
            }
            if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
                const content = line.trim().substring(2);
                return (
                    <li key={idx} style={{ marginLeft: "20px", color: "#cbd5e1", marginBottom: "6px", listStyleType: "disc" }}>
                        {parseBold(content)}
                    </li>
                );
            }
            const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
            if (numMatch) {
                return (
                    <div key={idx} style={{ marginLeft: "20px", display: "flex", gap: "8px", color: "#cbd5e1", marginBottom: "6px" }}>
                        <span style={{ color: "#00e5ff", fontWeight: "bold" }}>{numMatch[1]}.</span>
                        <span>{parseBold(numMatch[2])}</span>
                    </div>
                );
            }
            if (line.trim() === "") {
                return <div key={idx} style={{ height: "6px" }} />;
            }
            return <p key={idx} style={{ color: "#94a3b8", lineHeight: "1.6", marginBottom: "8px", fontSize: "0.95rem" }}>{parseBold(line)}</p>;
        });
    };

    return (
        <div style={{
            background: "linear-gradient(135deg, #0b0f19 0%, #1e1b4b 50%, #0f172a 100%)",
            minHeight: "100vh",
            padding: "40px 24px",
            color: "#f8fafc",
            fontFamily: "'Outfit', 'Inter', sans-serif"
        }}>
            {/* Navigation Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                maxWidth: '900px',
                margin: '0 auto 32px auto',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <IconButton 
                        onClick={() => routeTo("/home")}
                        style={{ 
                            color: "#00e5ff",
                            background: "rgba(0, 229, 255, 0.1)",
                            border: "1px solid rgba(0, 229, 255, 0.2)",
                            padding: "8px"
                        }}
                    >
                        <HomeIcon />
                    </IconButton >
                    <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: 700, background: "linear-gradient(90deg, #00e5ff, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        Meeting Intelligence Logs
                    </h1>
                </div>
                <Typography style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.9rem" }}>
                    Total Sessions: {meetings.length}
                </Typography>
            </div>

            {/* List of Meetings */}
            <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {meetings.length !== 0 ? (
                    meetings.map((meeting, i) => {
                        const isExpanded = expandedMeeting === meeting._id;
                        return (
                            <Card 
                                key={meeting._id || i} 
                                variant="outlined"
                                style={{
                                    background: "rgba(30, 41, 59, 0.4)",
                                    backdropFilter: "blur(12px)",
                                    border: isExpanded ? "1px solid rgba(0, 229, 255, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
                                    borderRadius: "16px",
                                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    boxShadow: isExpanded ? "0 10px 25px -5px rgba(0, 229, 255, 0.1)" : "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                                }}
                            >
                                <CardContent style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <CodeIcon style={{ color: '#a855f7', fontSize: '1.2rem' }} />
                                                <Typography style={{ fontWeight: 600, fontSize: '1.1rem', color: '#f1f5f9' }}>
                                                    Room: {meeting.meetingCode}
                                                </Typography>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <EventIcon style={{ color: '#64748b', fontSize: '1.1rem' }} />
                                                <Typography style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                                    {formatDate(meeting.date)}
                                                </Typography>
                                            </div>
                                        </div>

                                        <Button 
                                            variant="outlined"
                                            onClick={() => toggleExpand(meeting._id)}
                                            style={{
                                                borderColor: isExpanded ? "#00e5ff" : "rgba(255, 255, 255, 0.15)",
                                                color: isExpanded ? "#00e5ff" : "#f1f5f9",
                                                borderRadius: "8px",
                                                textTransform: "none",
                                                padding: "6px 14px",
                                                display: 'flex',
                                                gap: '6px',
                                                background: isExpanded ? "rgba(0, 229, 255, 0.05)" : "transparent"
                                            }}
                                        >
                                            {isExpanded ? (
                                                <>Collapse Logs <ExpandLessIcon style={{ fontSize: '1.1rem' }} /></>
                                            ) : (
                                                <>View Summary & Tasks <ExpandMoreIcon style={{ fontSize: '1.1rem' }} /></>
                                            )}
                                        </Button>
                                    </div>

                                    {/* Expandable Section */}
                                    {isExpanded && (
                                        <div style={{ 
                                            marginTop: '20px', 
                                            paddingTop: '20px', 
                                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                                            animation: 'fadeIn 0.3s ease-out'
                                        }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', alignItems: 'start' }}>
                                                {/* Left Column: Meeting Summary */}
                                                <div style={{
                                                    background: 'rgba(15, 23, 42, 0.3)',
                                                    borderRadius: '12px',
                                                    padding: '20px',
                                                    border: '1px solid rgba(255, 255, 255, 0.04)'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                        <AutoAwesomeIcon style={{ color: '#00e5ff', fontSize: '1.2rem' }} />
                                                        <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc' }}>AI Executive Summary</h3>
                                                    </div>
                                                    <div style={{ overflowWrap: 'break-word' }}>
                                                        {renderMarkdown(meeting.summary)}
                                                    </div>
                                                </div>

                                                {/* Right Column: Action Items */}
                                                <div style={{
                                                    background: 'rgba(15, 23, 42, 0.3)',
                                                    borderRadius: '12px',
                                                    padding: '20px',
                                                    border: '1px solid rgba(255, 255, 255, 0.04)'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                                        <AssignmentTurnedInIcon style={{ color: '#34d399', fontSize: '1.2rem' }} />
                                                        <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc' }}>
                                                            Extracted Tasks ({meeting.actionItems ? meeting.actionItems.length : 0})
                                                        </h3>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {meeting.actionItems && meeting.actionItems.length > 0 ? (
                                                            meeting.actionItems.map((item, idx) => (
                                                                <div 
                                                                    key={idx}
                                                                    style={{
                                                                        background: 'rgba(52, 211, 153, 0.05)',
                                                                        border: '1px solid rgba(52, 211, 153, 0.15)',
                                                                        borderRadius: '10px',
                                                                        padding: '10px 12px'
                                                                    }}
                                                                >
                                                                    <span style={{
                                                                        display: 'inline-block',
                                                                        background: 'rgba(52, 211, 153, 0.15)',
                                                                        color: '#34d399',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 600,
                                                                        borderRadius: '12px',
                                                                        padding: '2px 8px',
                                                                        marginBottom: '6px'
                                                                    }}>
                                                                        {item.assignee}
                                                                    </span>
                                                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 500 }}>
                                                                        {item.task}
                                                                    </p>
                                                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                                                                        Context: "{item.raw_text}"
                                                                    </p>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <Typography style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', textAlign: 'center', padding: '16px' }}>
                                                                No action items were registered.
                                                            </Typography>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })
                ) : (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '60px 20px', 
                        background: 'rgba(255, 255, 255, 0.02)', 
                        border: '1px dashed rgba(255, 255, 255, 0.1)', 
                        borderRadius: '16px' 
                    }}>
                        <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem' }}>
                            No meeting activity log available.
                        </Typography>
                        <Button 
                            variant="contained" 
                            onClick={() => routeTo("/home")}
                            style={{ 
                                marginTop: '16px', 
                                background: 'linear-gradient(90deg, #00e5ff, #a855f7)', 
                                border: 0, 
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: '8px'
                            }}
                        >
                            Host or Join a Meeting
                        </Button>
                    </div>
                )}
            </div>

            {/* Injected style keyframes for fade animation */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </div>
    );
}
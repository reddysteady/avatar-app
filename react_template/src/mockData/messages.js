// Mock message data to simulate backend responses
export const mockMessages = [
  {
    id: "1",
    senderName: "Emma Johnson",
    senderId: "user123",
    platform: "Instagram",
    content: "Hey! I love your content. How long have you been creating videos?",
    timestamp: "2023-05-10T14:30:00Z",
    isRead: true,
    status: "RESPONDED",
    response: "Thank you so much, Emma! I've been creating content for about 3 years now. Started as a hobby and it grew from there. Really appreciate your support!",
    isAutoResponded: true,
    respondedAt: "2023-05-10T14:35:00Z"
  },
  {
    id: "2",
    senderName: "Mike Smith",
    senderId: "user456",
    platform: "YouTube",
    content: "Your latest video was awesome! Can you do a tutorial on how you edit your videos?",
    timestamp: "2023-05-11T09:22:00Z",
    isRead: true,
    status: "RESPONDED",
    response: "Thanks Mike! I'm so glad you enjoyed it. I'm actually planning an editing tutorial for next month - stay tuned! Any specific techniques you're interested in?",
    isAutoResponded: true,
    respondedAt: "2023-05-11T10:15:00Z"
  },
  {
    id: "3",
    senderName: "Sarah Williams",
    senderId: "user789",
    platform: "Instagram",
    content: "Would you be interested in a brand collaboration? I work with XYZ Company.",
    timestamp: "2023-05-11T16:40:00Z",
    isRead: true,
    status: "AWAITING_REVIEW",
    response: "Hi Sarah, thanks for reaching out! I'm always open to exploring collaboration opportunities. Could you please share more details about what you have in mind? You can also email me at contact@myemail.com with the proposal.",
    isAutoResponded: true
  },
  {
    id: "4",
    senderName: "Tyler Rodriguez",
    senderId: "user101",
    platform: "YouTube",
    content: "This video is clickbait. You didn't even cover the topic in the title.",
    timestamp: "2023-05-12T08:15:00Z",
    isRead: false,
    status: "PENDING"
  },
  {
    id: "5",
    senderName: "Jessica Lee",
    senderId: "user202",
    platform: "Instagram",
    content: "Where did you get that shirt from? It looks amazing!",
    timestamp: "2023-05-12T10:30:00Z",
    isRead: false,
    status: "AUTO_RESPONDING"
  },
  {
    id: "6",
    senderName: "David Wilson",
    senderId: "user303",
    platform: "YouTube",
    content: "Can we collaborate on a video together? I have around 20k subscribers.",
    timestamp: "2023-05-12T13:45:00Z",
    isRead: false,
    status: "AWAITING_REVIEW",
    response: "Hi David, thanks for reaching out about a potential collaboration! I'm always looking to work with other creators. Could you send me a link to your channel so I can check out your content? We can discuss ideas if our styles align well.",
    isAutoResponded: true
  },
  {
    id: "7",
    senderName: "Amanda Chen",
    senderId: "user404",
    platform: "Instagram",
    content: "Your content has really helped me improve my own skills. Thank you!",
    timestamp: "2023-05-12T15:20:00Z",
    isRead: false,
    status: "PENDING"
  },
  {
    id: "8",
    senderName: "Kevin Taylor",
    senderId: "user505",
    platform: "YouTube",
    content: "Do you offer private coaching sessions?",
    timestamp: "2023-05-12T16:05:00Z",
    isRead: false,
    status: "PENDING"
  },
  {
    id: "9",
    senderName: "Olivia Martin",
    senderId: "user606",
    platform: "Instagram",
    content: "When are you going to post next? Can't wait for more content!",
    timestamp: "2023-05-12T17:30:00Z",
    isRead: false,
    status: "PENDING"
  },
  {
    id: "10",
    senderName: "Ryan Garcia",
    senderId: "user707",
    platform: "YouTube",
    content: "What camera do you use for your vlogs? The quality is incredible!",
    timestamp: "2023-05-12T18:45:00Z",
    isRead: false,
    status: "PENDING"
  }
];
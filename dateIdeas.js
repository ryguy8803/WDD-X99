const dateIdeas = [
  {
    id: 1,
    title: "Cozy Hot Chocolate",
    description: "Visit two cafés, split a pastry, and rate your favorite drink.",
    dollars: 1,
    image: "https://images.unsplash.com/photo-1517578239113-b03992dcdd25?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Food & Drink",
    tags: ["indoor", "quick", "purchase", "lazy"]
  },
  {
    id: 2,
    title: "Sunset Park Walk",
    description: "Take a slow walk, bring a blanket, and watch the sunset.",
    dollars: 0,
    image: "https://images.unsplash.com/photo-1622613067976-83ab42437564?q=80&w=988&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Nature",
    tags: ["outdoor", "quick", "free", "lazy"]
  },
  {
    id: 3,
    title: "Beach Day",
    description: "Pack snacks, play in the sand, and build a sand castle.",
    dollars: 1,
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    category: "Nature",
    tags: ["outdoor", "long", "purchase", "high energy"]
  },
  {
    id: 4,
    title: "Home Paint Night",
    description: "Pick a theme, paint together, and share your art.",
    dollars: 1,
    image: "https://images.unsplash.com/photo-1612743140645-cd448eac75f4?q=80&w=2532&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Creative",
    tags: ["indoor", "long", "purchase", "lazy"]
  },
  {
    id: 5,
    title: "Board Game Battle",
    description: "Choose a new game, keep score, and crown a winner.",
    dollars: 0,
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    category: "Games",
    tags: ["indoor", "long", "free", "lazy"]
  },
  {
    id: 6,
    title: "Trampoline Park",
    description: "Jump around and try a few friendly challenges.",
    dollars: 2,
    image: "https://images.unsplash.com/photo-1751235640841-d8d1035a80f0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Fitness",
    tags: ["indoor", "long", "purchase", "high energy"]
  },
  {
    id: 7,
    title: "Museum Mini Tour",
    description: "Pick three exhibits, take photos, and trade favorites.",
    dollars: 2,
    image: "https://images.unsplash.com/photo-1563000215-e31a8ddcb2d0?q=80&w=2056&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Learning & Culture",
    tags: ["indoor", "long", "purchase", "lazy"]
  },
  {
    id: 8,
    title: "Library Browse + Book Swap",
    description: "Choose a book for each other and read the first chapter.",
    dollars: 0,
    image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=800&q=80",
    category: "Learning & Culture",
    tags: ["indoor", "quick", "free", "lazy"]
  },
  {
    id: 9,
    title: "Bike Ride Loop",
    description: "Ride a scenic loop and stop for a photo break.",
    dollars: 0,
    image: "https://images.unsplash.com/photo-1571333249291-a6ec5e134a21?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Fitness",
    tags: ["outdoor", "long", "free", "high energy"]
  },
  {
    id: 10,
    title: "Street Food Tasting",
    description: "Try two new vendors and rate your favorite bite.",
    dollars: 2,
    image: "https://images.unsplash.com/photo-1552912470-ee2e96439539?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3RyZWV0JTIwZm9vZHxlbnwwfHwwfHx8MA%3D%3D",
    category: "Food & Drink",
    tags: ["outdoor", "quick", "purchase", "high energy"]
  },
  {
    id: 11,
    title: "Stargazing Picnic",
    description: "Bring a blanket, snacks, and look for constellations.",
    dollars: 1,
    image: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=800&q=80",
    category: "Nature",
    tags: ["outdoor", "long", "purchase", "lazy"]
  },
  {
    id: 12,
    title: "DIY Dessert Night",
    description: "Make sundaes or cookies and create a topping bar.",
    dollars: 1,
    image: "https://images.unsplash.com/photo-1574085733277-851d9d856a3a?q=80&w=2076&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Food & Drink",
    tags: ["indoor", "long", "purchase", "lazy"]
  },
  {
    id: 13,
    title: "Farmers Market Stroll",
    description: "Wander the stalls, sample fruit, and pick ingredients for dinner.",
    dollars: 1,
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=800&q=80",
    category: "Food & Drink",
    tags: ["outdoor", "quick", "purchase", "lazy"]
  },
  {
    id: 14,
    title: "Mini Golf Match",
    description: "Play 18 holes and add a goofy prize for the winner.",
    dollars: 2,
    image: "https://plus.unsplash.com/premium_photo-1661353251657-623ef3d56af0?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Games",
    tags: ["outdoor", "long", "purchase", "high energy"]
  },
  {
    id: 15,
    title: "Cooking Class Night",
    description: "Try a class together and recreate the dish at home later.",
    dollars: 3,
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
    category: "Learning & Culture",
    tags: ["indoor", "long", "purchase", "high energy"]
  },
  {
    id: 16,
    title: "Scenic Hike",
    description: "Pick a trail, bring water, and find the best viewpoint.",
    dollars: 0,
    image: "https://images.unsplash.com/photo-1520962880247-cfaf541c8724?q=80&w=2532&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Nature",
    tags: ["outdoor", "long", "free", "high energy"]
  },
  {
    id: 17,
    title: "Yoga Flow Together",
    description: "Do a beginner routine and cool down with tea.",
    dollars: 0,
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
    category: "Fitness",
    tags: ["indoor", "quick", "free", "lazy"]
  },
  {
    id: 18,
    title: "Live Music Night",
    description: "Catch a local band and share your favorite song.",
    dollars: 2,
    image: "https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=800&q=80",
    category: "Learning & Culture",
    tags: ["indoor", "long", "purchase", "high energy"]
  },
  {
    id: 19,
    title: "Puzzle + Playlist",
    description: "Put on a playlist and finish a 500-piece puzzle together.",
    dollars: 0,
    image: "https://images.unsplash.com/photo-1588591795084-1770cb3be374?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8cHV6emxlfGVufDB8fDB8fHww",
    category: "Games",
    tags: ["indoor", "long", "free", "lazy"]
  },
  {
    id: 20,
    title: "Photo Scavenger Hunt",
    description: "Make a list of photo prompts and race to capture them.",
    dollars: 0,
    image: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=800&q=80",
    category: "Creative",
    tags: ["outdoor", "long", "free", "high energy"]
  },
  {
    id: 21,
    title: "Ice Cream Taste Test",
    description: "Try three flavors and rank them with a scorecard.",
    dollars: 1,
    image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=800&q=80",
    category: "Food & Drink",
    tags: ["indoor", "quick", "purchase", "lazy"]
  }
];

export default dateIdeas;

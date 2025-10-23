// 创建电影海报占位图脚本
const fs = require('fs');
const path = require('path');

// 近五年热门电影列表 (中国电影占70%以上)
const movies = [
    // 中国电影 (70%+)
    { name: "流浪地球2", year: "2023", color: "#FF6B00" },
    { name: "满江红", year: "2023", color: "#DC143C" },
    { name: "狂飙", year: "2023", color: "#8B0000" },
    { name: "长津湖之水门桥", year: "2022", color: "#B22222" },
    { name: "你好李焕英", year: "2021", color: "#FF69B4" },
    { name: "唐人街探案3", year: "2021", color: "#FFD700" },
    { name: "我和我的父辈", year: "2021", color: "#4169E1" },
    { name: "中国医生", year: "2021", color: "#32CD32" },
    { name: "八佰", year: "2020", color: "#8B4513" },
    { name: "我和我的家乡", year: "2020", color: "#FF6347" },
    { name: "姜子牙", year: "2020", color: "#9370DB" },
    { name: "夺冠", year: "2020", color: "#FF4500" },
    { name: "哪吒之魔童降世", year: "2019", color: "#FF1493" },
    { name: "流浪地球", year: "2019", color: "#00CED1" },
    { name: "复仇者联盟4", year: "2019", color: "#1E90FF" },
    
    // 外国电影 (30%-)
    { name: "Avatar 2", year: "2022", color: "#00BFFF" },
    { name: "Top Gun 2", year: "2022", color: "#FF8C00" },
    { name: "Spider-Man", year: "2021", color: "#DC143C" },
    { name: "Black Widow", year: "2021", color: "#800080" },
    { name: "Dune", year: "2021", color: "#8B4513" },
    { name: "No Time to Die", year: "2021", color: "#2F4F4F" },
    { name: "Tenet", year: "2020", color: "#000080" },
    { name: "Wonder Woman", year: "2020", color: "#FFD700" }
];

// 创建SVG海报
function createMoviePoster(movie, index) {
    const svg = `<svg width="200" height="300" viewBox="0 0 200 300" fill="none" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="grad${index}" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" style="stop-color:${movie.color};stop-opacity:1" />
<stop offset="100%" style="stop-color:${movie.color}88;stop-opacity:1" />
</linearGradient>
<filter id="shadow${index}">
<feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.3)"/>
</filter>
</defs>
<rect width="200" height="300" fill="url(#grad${index})" rx="8" filter="url(#shadow${index})"/>
<rect x="10" y="10" width="180" height="220" fill="rgba(255,255,255,0.1)" rx="4"/>
<text x="100" y="250" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">${movie.name}</text>
<text x="100" y="270" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.8)" text-anchor="middle">${movie.year}</text>
</svg>`;
    
    return svg;
}

// 创建所有海报文件
movies.forEach((movie, index) => {
    const svg = createMoviePoster(movie, index);
    const filename = `movie-${index + 1}.svg`;
    const filepath = path.join(__dirname, 'images', 'movies', filename);
    
    fs.writeFileSync(filepath, svg);
    console.log(`Created: ${filename} - ${movie.name} (${movie.year})`);
});

console.log(`\nCreated ${movies.length} movie posters!`);
console.log(`Chinese movies: ${movies.filter(m => !m.name.includes(' ') && !m.name.includes('Avatar') && !m.name.includes('Top Gun') && !m.name.includes('Spider-Man') && !m.name.includes('Black Widow') && !m.name.includes('Dune') && !m.name.includes('No Time to Die') && !m.name.includes('Tenet') && !m.name.includes('Wonder Woman')).length}`);
console.log(`Foreign movies: ${movies.filter(m => m.name.includes(' ') || m.name.includes('Avatar') || m.name.includes('Top Gun') || m.name.includes('Spider-Man') || m.name.includes('Black Widow') || m.name.includes('Dune') || m.name.includes('No Time to Die') || m.name.includes('Tenet') || m.name.includes('Wonder Woman')).length}`);




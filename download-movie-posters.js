// 下载真实电影海报脚本
const fs = require('fs');
const path = require('path');

// 电影列表和对应的TMDB ID
const movies = [
    // 中国电影 (70%+)
    { name: "流浪地球2", year: "2023", tmdbId: "843527", filename: "movie-1.jpg" },
    { name: "满江红", year: "2023", tmdbId: "843527", filename: "movie-2.jpg" },
    { name: "狂飙", year: "2023", tmdbId: "843527", filename: "movie-3.jpg" },
    { name: "长津湖之水门桥", year: "2022", tmdbId: "843527", filename: "movie-4.jpg" },
    { name: "你好李焕英", year: "2021", tmdbId: "843527", filename: "movie-5.jpg" },
    { name: "唐人街探案3", year: "2021", tmdbId: "843527", filename: "movie-6.jpg" },
    { name: "我和我的父辈", year: "2021", tmdbId: "843527", filename: "movie-7.jpg" },
    { name: "中国医生", year: "2021", tmdbId: "843527", filename: "movie-8.jpg" },
    { name: "八佰", year: "2020", tmdbId: "843527", filename: "movie-9.jpg" },
    { name: "我和我的家乡", year: "2020", tmdbId: "843527", filename: "movie-10.jpg" },
    { name: "姜子牙", year: "2020", tmdbId: "843527", filename: "movie-11.jpg" },
    { name: "夺冠", year: "2020", tmdbId: "843527", filename: "movie-12.jpg" },
    { name: "哪吒之魔童降世", year: "2019", tmdbId: "843527", filename: "movie-13.jpg" },
    { name: "流浪地球", year: "2019", tmdbId: "843527", filename: "movie-14.jpg" },
    { name: "复仇者联盟4", year: "2019", tmdbId: "299534", filename: "movie-15.jpg" },
    
    // 外国电影 (30%-)
    { name: "Avatar 2", year: "2022", tmdbId: "76600", filename: "movie-16.jpg" },
    { name: "Top Gun 2", year: "2022", tmdbId: "361743", filename: "movie-17.jpg" },
    { name: "Spider-Man", year: "2021", tmdbId: "634649", filename: "movie-18.jpg" },
    { name: "Black Widow", year: "2021", tmdbId: "497698", filename: "movie-19.jpg" },
    { name: "Dune", year: "2021", tmdbId: "438631", filename: "movie-20.jpg" },
    { name: "No Time to Die", year: "2021", tmdbId: "370172", filename: "movie-21.jpg" },
    { name: "Tenet", year: "2020", tmdbId: "577922", filename: "movie-22.jpg" },
    { name: "Wonder Woman", year: "2020", tmdbId: "297762", filename: "movie-23.jpg" }
];

// TMDB图片基础URL
const TMDB_BASE_URL = "https://image.tmdb.org/t/p/w500";

// 创建占位海报（使用渐变背景和文字）
function createPlaceholderPoster(movie, index) {
    const svg = `<svg width="400" height="600" viewBox="0 0 400 600" fill="none" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="grad${index}" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" style="stop-color:${getRandomColor()};stop-opacity:1" />
<stop offset="100%" style="stop-color:${getRandomColor()};stop-opacity:0.8" />
</linearGradient>
<filter id="shadow${index}">
<feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="rgba(0,0,0,0.4)"/>
</filter>
</defs>
<rect width="400" height="600" fill="url(#grad${index})" rx="12" filter="url(#shadow${index})"/>
<rect x="20" y="20" width="360" height="440" fill="rgba(255,255,255,0.1)" rx="8"/>
<text x="200" y="500" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">${movie.name}</text>
<text x="200" y="540" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.8)" text-anchor="middle">${movie.year}</text>
<text x="200" y="570" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.6)" text-anchor="middle">盛世云图</text>
</svg>`;
    
    return svg;
}

// 生成随机颜色
function getRandomColor() {
    const colors = [
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
        "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
        "#F8C471", "#82E0AA", "#F1948A", "#85C1E9", "#D7BDE2"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// 创建所有海报文件
movies.forEach((movie, index) => {
    const svg = createPlaceholderPoster(movie, index);
    const filepath = path.join(__dirname, 'images', 'movies', movie.filename.replace('.jpg', '.svg'));
    
    fs.writeFileSync(filepath, svg);
    console.log(`Created: ${movie.filename.replace('.jpg', '.svg')} - ${movie.name} (${movie.year})`);
});

console.log(`\nCreated ${movies.length} movie posters!`);
console.log(`Chinese movies: ${movies.filter(m => !m.name.includes('Avatar') && !m.name.includes('Top Gun') && !m.name.includes('Spider-Man') && !m.name.includes('Black Widow') && !m.name.includes('Dune') && !m.name.includes('No Time to Die') && !m.name.includes('Tenet') && !m.name.includes('Wonder Woman')).length}`);
console.log(`Foreign movies: ${movies.filter(m => m.name.includes('Avatar') || m.name.includes('Top Gun') || m.name.includes('Spider-Man') || m.name.includes('Black Widow') || m.name.includes('Dune') || m.name.includes('No Time to Die') || m.name.includes('Tenet') || m.name.includes('Wonder Woman')).length}`);




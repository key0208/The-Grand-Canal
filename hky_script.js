// Set maptiler Access Token
maptilersdk.config.apiKey = 'y9ojKtjS4KN4UaiG5YUB';

// Initialize the map
const map = new maptilersdk.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/0196a47b-9a4a-7581-85b3-4ad07e239d9a/style.json?key=y9ojKtjS4KN4UaiG5YUB',
    center: [119.6, 31.9], 
    zoom: 6.0,
    pitch: 60,        // 倾斜角度（0-85°）
    bearing: 0,     // 地图朝向角度（顺时针）
    antialias: true   // 开启抗锯齿以支持 3D
});

// 创建弹出窗口
const popup = new maptilersdk.Popup({
    closeButton: false,
    closeOnClick: true,
    maxWidth: '300px'
});

let ball = null;
let animationFrame = null;
let progress = 0;
let speed = 7.5; //初始速度变量
let isPaused = false;
let routePoints = [];
let totalDistance = 0;

// 等待地图加载完成 - SINGLE map.on('load') handler
map.on('load', function() {
    console.log('地图加载完成');
    
    // 加载重要城市位置
    loadCity();
    
    // 加载古运河数据
    loadCanalData();
    
    // 加载技术传播路线数据
    loadTechnologyData();
    
    // 创建图例
    createLegend();
    
    // 等待所有图层加载完成后设置点击处理程序
    // 使用setTimeout确保所有图层都已添加到地图
    setTimeout(() => {
        setupTechnologyRouteClickHandlers();
        console.log('设置了技术路线点击处理程序');
        
        // 移除loading遮罩
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }, 1000); // 给予1秒钟确保所有图层已加载
});

// 加载城市数据函数
function loadCity(){
    d3.json('./hky_data/techpoints.geojson')
    .then(data => {
        console.log('成功加载重要城市数据');
        
        // 添加GeoJSON数据源
        map.addSource('canal-city', {
            type: 'geojson',
            data: data
        });
            
        // 添加线条图层
        map.addLayer({
            id: 'canal-city-point',
            type: 'circle',
            source: 'canal-city',
            paint: {
                'circle-radius': 8,
                'circle-color': '#5d6252',
                'circle-stroke-width': 0.6,
                'circle-stroke-color': '#ffffff'
            }
        });
        
        // 添加城市名称文本图层
        map.addLayer({
            id: 'city-labels',
            type: 'symbol',
            source: 'canal-city',
            layout: {
                'text-field': ['get', '点位'],
                'text-size': 14,
                'text-offset': [0, 1.5],
                'text-anchor': 'top',
                'text-font': ['Montserrat Bold', 'Arial Unicode MS Bold']  // 设置粗体字体
            },
            paint: {
                'text-color': '#404040',
                'text-halo-color': '#fff',
                'text-halo-width': 2
            }
        });
    })
    .catch(error => {
        console.error('加载city.geojson失败:', error);
    });
}

// 加载古运河数据函数
function loadCanalData(){
    d3.json('./hky_data/canal.geojson')
    .then(data => {
        console.log('成功加载古运河GeoJSON数据');
        
        // 添加GeoJSON数据源
        map.addSource('canal-base-data', {
            type: 'geojson',
            data: data
        });
            
        // 添加线条图层
        map.addLayer({
            id: 'canal-base-line',
            type: 'line',
            source: 'canal-base-data',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#19262b',
                'line-width': 4.3,
                'line-opacity': 0.7
            }
        });
    })
    .catch(error => {
        console.error('加载canal.geojson失败:', error);
    });
}

// Function to load technology transfer data
function loadTechnologyData() {
    // Parse the GeoJSON data
    const technologyData = {
    "type": "FeatureCollection",
    "name": "technology_way",
    "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
    "features": [
        { "type": "Feature", "properties": { "技术领域": "Hydraulic Engineering", "传播内容": "Earthen Dam Water Level Control", "朝代": "Sui and Tang Dynasties (581-907)", "起点": "Suzhou Section", "X (经度)": 120.6, "Y (纬度)": 31.3, "终点": "Kaifeng", "X (经度)_1": 114.3, "Y (纬度)_1": 34.8, "备注": "Regulating water flow and level." }, "geometry": { "type": "MultiLineString", "coordinates": [ [ [ 120.6, 31.3 ], [ 114.3, 34.8 ] ] ] } },
        { "type": "Feature", "properties": { "技术领域": "Hydraulic Engineering", "传播内容": "Multi-level Ship Lock System", "朝代": "Yuan Dynasty (1271-1368)", "起点": "Nanwang", "X (经度)": 116.3, "Y (纬度)": 35.5, "终点": "Hangzhou", "X (经度)_1": 120.2, "Y (纬度)_1": 30.3, "备注": "Solving elevation difference problems in river sections." }, "geometry": { "type": "MultiLineString", "coordinates": [ [ [ 116.3, 35.5 ], [ 120.2, 30.3 ] ] ] } },
        { "type": "Feature", "properties": { "技术领域": "Hydraulic Engineering", "传播内容": "Narrowing Channels to Flush Sediment", "朝代": "Ming Dynasty (1368-1644)", "起点": "Huai'an", "X (经度)": 119.0, "Y (纬度)": 33.5, "终点": "Zhengzhou", "X (经度)_1": 113.6, "Y (纬度)_1": 34.7, "备注": "Solving river siltation problems." }, "geometry": { "type": "MultiLineString", "coordinates": [ [ [ 119.0, 33.5 ], [ 113.6, 34.7 ] ] ] } },
        { "type": "Feature", "properties": { "技术领域": "Shipbuilding Technology", "传播内容": "Flat-Bottomed Shallow-Hold Boat", "朝代": "Song Dynasty (960-1279)", "起点": "Kaifeng", "X (经度)": 114.3, "Y (纬度)": 34.8, "终点": "Suzhou", "X (经度)_1": 120.6, "Y (纬度)_1": 31.3, "备注": "Standardization of water transport, adapted to northern shallow waterways." }, "geometry": { "type": "MultiLineString", "coordinates": [ [ [ 114.3, 34.8 ], [ 120.6, 31.3 ] ] ] } },
        { "type": "Feature", "properties": { "技术领域": "Shipbuilding Technology", "传播内容": "Deep-hull Pointed-bottom Boats & Mortise-tenon Joinery", "朝代": "Ming Dynasty (1368-1644)", "起点": "Hangzhou", "X (经度)": 120.2, "Y (纬度)": 30.3, "终点": "Huai'an", "X (经度)_1": 119.0, "Y (纬度)_1": 33.5, "备注": "Shipyards integrated northern and southern technologies, increasing load capacity." }, "geometry": { "type": "MultiLineString", "coordinates": [ [ [ 120.2, 30.3 ], [ 119.0, 33.5 ] ] ] } },
        { "type": "Feature", "properties": { "技术领域": "Printing Technology", "传播内容": "Woodblock Printing", "朝代": "Ming Dynasty (1368-1644)", "起点": "Hangzhou", "X (经度)": 120.2, "Y (纬度)": 30.3, "终点": "Beijing", "X (经度)_1": 116.4, "Y (纬度)_1": 39.9, "备注": "Southern craftsmen relocated north, promoting regional technical exchange." }, "geometry": { "type": "MultiLineString", "coordinates": [ [ [ 120.2, 30.3 ], [ 116.4, 39.9 ] ] ] } },
        { "type": "Feature", "properties": { "技术领域": "Printing Technology", "传播内容": "Color-printed Woodblock Technique", "朝代": "Ming and Qing Dynasties (1368-1912)", "起点": "Suzhou", "X (经度)": 120.6, "Y (纬度)": 31.3, "终点": "Liaocheng", "X (经度)_1": 115.9, "Y (纬度)_1": 36.4, "备注": "Gave birth to Liaocheng woodblock New Year prints, spread through canal merchants." }, "geometry": { "type": "MultiLineString", "coordinates": [ [ [ 120.6, 31.3 ], [ 115.9, 36.4 ] ] ] } },
        { "type": "Feature", "properties": { "技术领域": "Agriculture & Tools", "传播内容": "Water-powered Spinning Wheel", "朝代": "Yuan Dynasty (1271-1368)", "起点": "Dongping", "X (经度)": 116.5, "Y (纬度)": 35.9, "终点": "Shanghai", "X (经度)_1": 121.5, "Y (纬度)_1": 31.2, "备注": "Improved textile production efficiency in Jiangnan region." }, "geometry": { "type": "MultiLineString", "coordinates": [ [ [ 116.5, 35.9 ], [ 121.5, 31.2 ] ] ] } },
        { "type": "Feature", "properties": { "技术领域": "Agriculture & Tools", "传播内容": "River Desilting Tool: Dredging Rake", "朝代": "Song and Yuan Transition (1127-1279)", "起点": "Kaifeng", "X (经度)": 114.3, "Y (纬度)": 34.8, "终点": "Linqing", "X (经度)_1": 115.7, "Y (纬度)_1": 36.8, "备注": "Invented in Song Dynasty, became essential tool for waterway maintenance." }, "geometry": { "type": "MultiLineString", "coordinates": [ [ [ 114.3, 34.8 ], [ 115.7, 36.8 ] ] ] } },
        { "type": "Feature", "properties": { "技术领域": "Handicrafts", "传播内容": "White Porcelain Glaze & Firing Technique", "朝代": "Northern Song Dynasty (960-1127)", "起点": "Quyang", "X (经度)": 114.7, "Y (纬度)": 38.6, "终点": "Longquan", "X (经度)_1": 119.1, "Y (纬度)_1": 28.1, "备注": "Ding kiln technology spread south, influencing transformation of Longquan celadon." }, "geometry": { "type": "MultiLineString", "coordinates": [ [ [ 114.7, 38.6 ], [ 119.1, 28.1 ] ] ] } },
        { "type": "Feature", "properties": { "技术领域": "Handicrafts", "传播内容": "Cobalt Blue Pigment for Blue-and-white Porcelain", "朝代": "Yuan Dynasty (1271-1368)", "起点": "Tianjin", "X (经度)": 117.2, "Y (纬度)": 39.1, "终点": "Jingdezhen", "X (经度)_1": 117.2, "Y (纬度)_1": 29.3, "备注": "Cobalt material transported via canal, promoting blue-and-white porcelain prosperity." }, "geometry": { "type": "MultiLineString", "coordinates": [ [ [ 117.2, 39.1 ], [ 117.2, 29.3 ] ] ] } },
        { "type": "Feature", "properties": { "技术领域": "Handicrafts", "传播内容": "Porcelain-making Technique", "朝代": "Yuan, Ming and Qing Period (1271-1644)", "起点": "Jingdezhen", "X (经度)": 117.2, "Y (纬度)": 29.292, "终点": "Beijing", "X (经度)_1": 116.4074, "Y (纬度)_1": 39.9042, "备注": "Convenient water transport promoted northward spread of fine craftsmanship" }, "geometry": { "type": "MultiLineString", "coordinates": [ [ [ 117.2, 29.292 ], [ 116.4074, 39.9042 ] ] ] } },
        { "type": "Feature", "properties": { "技术领域": "Handicrafts", "传播内容": "Huang Daopo's Cotton Spinning Technique", "朝代": "Yuan Dynasty (1271-1368)", "起点": "Shanghai", "X (经度)": 121.5, "Y (纬度)": 31.2, "终点": "Anyang", "X (经度)_1": 114.3, "Y (纬度)_1": 36.1, "备注": "Combined with northern hemp weaving, forming Wei cloth industry." }, "geometry": { "type": "MultiLineString", "coordinates": [ [ [ 121.5, 31.2 ], [ 114.3, 36.1 ] ] ] } },
        { "type": "Feature", "properties": { "技术领域": "Handicrafts", "传播内容": "Silk Weaving Technique", "朝代": "Yuan Dynasty (1271-1368)", "起点": "Hangzhou", "X (经度)": 120.17, "Y (纬度)": 30.25, "终点": "Ningbo", "X (经度)_1": 121.5436, "Y (纬度)_1": 29.8683, "备注": "Royal craftsmen promoted development of silk technology in surrounding areas" }, "geometry": { "type": "MultiLineString", "coordinates": [ [ [ 120.17, 30.25 ], [ 121.5436, 29.8683 ] ] ] } },
        { "type": "Feature", "properties": { "技术领域": "Handicrafts", "传播内容": "Huzhou Calligraphy Brush-making", "朝代": "Ming Dynasty (1368-1644)", "起点": "Huzhou", "X (经度)": 120.083, "Y (纬度)": 30.8932, "终点": "Liaocheng", "X (经度)_1": 115.9854, "Y (纬度)_1": 36.4561, "备注": "Huzhou brush craftsmen settled in Liaocheng, establishing canal brush workshops" }, "geometry": { "type": "MultiLineString", "coordinates": [ [ [ 120.083, 30.8932 ], [ 115.9854, 36.4561 ] ] ] } },
        { "type": "Feature", "properties": { "技术领域": "Handicrafts", "传播内容": "Suzhou Embroidery Technique", "朝代": "Ming and Qing Dynasties (1368-1912)", "起点": "Suzhou", "X (经度)": 120.5853, "Y (纬度)": 31.2989, "终点": "Hangzhou", "X (经度)_1": 120.1551, "Y (纬度)_1": 30.2741, "备注": "Formed unique 'Hangzhou Embroidery' style" }, "geometry": { "type": "MultiLineString", "coordinates": [ [ [ 120.5853, 31.2989 ], [ 120.1551, 30.2741 ] ] ] } },
        { "type": "Feature", "properties": { "技术领域": "Handicrafts", "传播内容": "Linqing Woodblock New Year Print Technique", "朝代": "Ming and Qing Dynasties (1368-1912)", "起点": "Linqing", "X (经度)": 115.711, "Y (纬度)": 36.8386, "终点": "Tianjin", "X (经度)_1": 117.201, "Y (纬度)_1": 39.0842, "备注": "Catalyzed golden age of northern New Year print art" }, "geometry": { "type": "MultiLineString", "coordinates": [ [ [ 115.711, 36.8386 ], [ 117.201, 39.0842 ] ] ] } },
        { "type": "Feature", "properties": { "技术领域": "Handicrafts", "传播内容": "Purple Clay Teapot: Yixing Zisha Teapot", "朝代": "Ming and Qing Dynasties (1368-1912)", "起点": "Yixing", "X (经度)": 119.8449, "Y (纬度)": 31.3641, "终点": "Tianjin", "X (经度)_1": 117.201, "Y (纬度)_1": 39.0842, "备注": "Stimulated development of local Tianjin pottery art" }, "geometry": { "type": "MultiLineString", "coordinates": [ [ [ 119.8449, 31.3641 ], [ 117.201, 39.0842 ] ] ] } }
    ]
};

    console.log('加载技术传播路线数据');
    
    // 添加GeoJSON数据源
    map.addSource('technology-route', {
        type: 'geojson',
        data: technologyData
    });

    // 根据朝代分类添加不同颜色的线条
    const dynasties = {
        'Sui and Tang Dynasties (581-907)': '#FF5733', 
        'Song Dynasty (960-1279)': '#33FF57',
        'Northern Song Dynasty (960-1127)': '#33FF57', // Same color as Song
        'Song and Yuan Transition (1127-1279)': '#33BBFF', // Transition color
        'Yuan Dynasty (1271-1368)': '#3357FF',
        'Ming Dynasty (1368-1644)': '#FF33A1',
        'Ming and Qing Dynasties (1368-1912)': '#A133FF', // 修正：原来是 'Ming and Qing Transition (1644-1683)'
        'Yuan, Ming and Qing Period (1271-1644)': '#7F33FF' // Transition color
    };

    // 为每个朝代创建一个图层
    Object.keys(dynasties).forEach(dynasty => {
        // 过滤特定朝代的特征
        const filter = ['==', ['get', '朝代'], dynasty];
        
        // 添加线图层
        map.addLayer({
            id: `technology-route-${dynasty}`,
            type: 'line',
            source: 'technology-route',
            filter: filter,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': dynasties[dynasty],
                'line-width': 3,
                'line-opacity': 0.7,
                'line-dasharray': [2, 1] // 虚线效果，表示技术传播路线
            }
        });
        
        // 添加箭头标记图层，表示传播方向
        map.addLayer({
            id: `technology-route-arrows-${dynasty}`,
            type: 'symbol',
            source: 'technology-route',
            filter: filter,
            layout: {
                'symbol-placement': 'line',
                'symbol-spacing': 100,
                'text-field': '▶',
                'text-size': 12,
                'text-allow-overlap': true,
                'text-ignore-placement': true,
                'text-keep-upright': false,
                'text-rotation-alignment': 'map',
                'text-anchor': 'center',
            },
            paint: {
                'text-color': dynasties[dynasty],
                'text-halo-color': '#fff',
                'text-halo-width': 1
            }
        });
    });
}

// 同时需要更新 createLegend 函数中的朝代显示
// 在 hky_script.js 文件中修改 createLegend 函数

function createLegend() {
    const legendContainer = document.createElement('div');
    legendContainer.className = 'legend';
    legendContainer.style.position = 'absolute';
    legendContainer.style.bottom = '30px';
    legendContainer.style.right = '10px';
    legendContainer.style.padding = '8px 12px';
    legendContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    legendContainer.style.backdropFilter = 'blur(5px)';
    legendContainer.style.border = '1px solid rgba(204, 204, 204, 0.6)';
    legendContainer.style.borderRadius = '5px';
    legendContainer.style.width = '450px';
    legendContainer.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
    legendContainer.style.fontSize = '12px';
    legendContainer.style.fontFamily = "'Montserrat Regular', sans-serif";
    legendContainer.style.zIndex = '100';
    
    // 创建两层结构
    const firstRow = document.createElement('div');
    firstRow.style.display = 'flex';
    firstRow.style.alignItems = 'center';
    firstRow.style.marginBottom = '4px';
    firstRow.style.gap = '10px';
    
    // 运河基础图层
    const canalBase = document.createElement('div');
    canalBase.style.display = 'flex';
    canalBase.style.alignItems = 'center';
    
    const canalBaseLine = document.createElement('div');
    canalBaseLine.style.width = '20px';
    canalBaseLine.style.height = '3px';
    canalBaseLine.style.backgroundColor = '#01445e';
    canalBaseLine.style.marginRight = '8px';
    
    canalBase.appendChild(canalBaseLine);
    canalBase.appendChild(document.createTextNode('The Grand Canal of China'));
    firstRow.appendChild(canalBase);
    
    // 朝代颜色图例
    const dynasties = {
        'Sui-Tang (581-907)': '#FF5733',        
        'Song (960-1279)': '#33FF57',           
        'Yuan (1271-1368)': '#3357FF',          
        'Ming (1368-1644)': '#FF33A1',          
        'Ming-Qing (1368-1912)': '#A133FF'
    };
    
    // 将朝代分成两组
    const dynastyEntries = Object.entries(dynasties);
    const firstRowDynasties = dynastyEntries.slice(0, 2);
    const secondRowDynasties = dynastyEntries.slice(2);
    
    // 添加前两个朝代到第一行
    firstRowDynasties.forEach(([dynasty, color]) => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.whiteSpace = 'nowrap';
        
        const line = document.createElement('div');
        line.style.width = '15px';
        line.style.height = '3px';
        line.style.backgroundColor = color;
        line.style.marginRight = '4px';
        line.style.borderTop = '1px dashed ' + color;
        
        item.appendChild(line);
        item.appendChild(document.createTextNode(dynasty));
        firstRow.appendChild(item);
    });
    
    // 第二行：剩余朝代
    const secondRow = document.createElement('div');
    secondRow.style.display = 'flex';
    secondRow.style.alignItems = 'center';
    secondRow.style.flexWrap = 'nowrap';
    secondRow.style.gap = '10px';
    // 移除了marginBottom，因为数据源部分有自己的marginTop
    
    secondRowDynasties.forEach(([dynasty, color]) => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.whiteSpace = 'nowrap';
        
        const line = document.createElement('div');
        line.style.width = '15px';
        line.style.height = '3px';
        line.style.backgroundColor = color;
        line.style.marginRight = '4px';
        line.style.borderTop = '1px dashed ' + color;
        
        item.appendChild(line);
        item.appendChild(document.createTextNode(dynasty));
        secondRow.appendChild(item);
    });
    
    // 👇 数据源部分 - 使用与你提供的样式完全一致的设置
    const dataSourceRow = document.createElement('div');
    // 应用与 #data-source-section 相同的样式
    dataSourceRow.style.flexBasis = 'auto';
    dataSourceRow.style.flexShrink = '0';
    dataSourceRow.style.padding = '0.5px 8px';
    dataSourceRow.style.fontSize = '9px';
    dataSourceRow.style.fontStyle = 'italic';
    dataSourceRow.style.color = '#777';
    dataSourceRow.style.backgroundColor = 'rgba(248, 244, 225, 0.2)';
    dataSourceRow.style.textAlign = 'justify';
    dataSourceRow.style.overflow = 'hidden';
    dataSourceRow.style.display = 'flex';
    dataSourceRow.style.alignItems = 'center';
    dataSourceRow.style.justifyContent = 'flex-start';
    dataSourceRow.style.borderBottom = 'none';
    dataSourceRow.style.marginTop = '3px';
    
    // 创建数据源内容
    const dataSourceContent = document.createElement('div');
    
    // 添加"Data Source:"标签
    const label = document.createElement('strong');
    label.textContent = 'Data Source: ';
    label.style.color = '#777'; // 与父元素颜色一致
    label.style.fontStyle = 'normal'; // 取消斜体
    dataSourceContent.appendChild(label);
    
    // 定义数据源链接
    const dataSources = [
        {
            name: 'Hydraulic Engineering',
            url: 'https://xueshu.baidu.com/usercenter/paper/show?paperid=111d06s0uf7n0gb0ag0g04t0sc343725&site=xueshu_se'
        },
        {
            name: 'Shipbuilding Technolege',
            url: 'https://xueshu.baidu.com/usercenter/paper/show?paperid=1h270p901t400am0vv0n0jh013559118&site=xueshu_se&hitarticle=1'
        },
        {
            name: 'Printing Technolege',
            url: 'https://www.youtube.com/watch?v=H9jXqFtrmpM'
        },
        {
            name: 'Relics Museum',
            url: 'https://canalmuseum.net/diancang.html'
        }
    ];
    
    // 创建链接
    dataSources.forEach((source, index) => {
        const link = document.createElement('a');
        link.href = source.url;
        link.target = '_blank'; // 在新标签页打开
        link.textContent = source.name;
        
        // 应用与 #data-source-section a 相同的样式
        link.style.color = '#777';
        link.style.textDecoration = 'none';
        link.style.transition = 'color 0.3s ease';
        
        // 悬停效果 - 与 #data-source-section a:hover 相同
        link.addEventListener('mouseenter', () => {
            link.style.color = '#CA9542';
            link.style.textDecoration = 'underline';
        });
        
        link.addEventListener('mouseleave', () => {
            link.style.color = '#777';
            link.style.textDecoration = 'none';
        });
        
        dataSourceContent.appendChild(link);
        
        // 添加分隔符（除了最后一个）
        if (index < dataSources.length - 1) {
            const separator = document.createTextNode(', ');
            dataSourceContent.appendChild(separator);
        }
    });
    
    dataSourceRow.appendChild(dataSourceContent);
    
    // 将所有行添加到图例容器
    legendContainer.appendChild(firstRow);
    legendContainer.appendChild(secondRow);
    legendContainer.appendChild(dataSourceRow); // 添加数据源行
    
    document.getElementById('map').appendChild(legendContainer);
}
// 还需要更新 setupTechnologyRouteClickHandlers 函数中的朝代列表
function setupTechnologyRouteClickHandlers() {
    console.log('设置技术路线点击处理程序');
    
    // 修正后的朝代列表 - 与GeoJSON数据完全匹配
    const dynasties = {
        'Sui and Tang Dynasties (581-907)': '#FF5733',
        'Song Dynasty (960-1279)': '#33FF57',
        'Northern Song Dynasty (960-1127)': '#33FF57', 
        'Song and Yuan Transition (1127-1279)': '#33BBFF',
        'Yuan Dynasty (1271-1368)': '#3357FF',
        'Ming Dynasty (1368-1644)': '#FF33A1',
        'Ming and Qing Dynasties (1368-1912)': '#A133FF', // 修正：原来是错误的时期名称
        'Yuan, Ming and Qing Period (1271-1644)': '#7F33FF'
    };
    
    // 为每个朝代的路线层添加点击事件
    Object.keys(dynasties).forEach(dynasty => {
        const layerId = `technology-route-${dynasty}`;
        
        // 确保图层已存在后再添加事件
        if (map.getLayer(layerId)) {
            map.on('click', layerId, (e) => {
                console.log(`点击了${dynasty}朝代的技术路线`, e.features[0]);
                
                // 获取点击位置的特征
                const feature = e.features[0];
                const props = feature.properties;
                
                // 创建弹窗内容
                const content = `
                    <div style="font-family: 'Playfair Display', serif;">
                        <h3 style="margin: 0 0 8px 0; color: #01445e;">${props['传播内容']}</h3>
                        <div style="margin-bottom: 8px;">
                            <span style="font-weight: bold;">Dynasty: </span>
                            <span>${props['朝代']}</span>
                        </div>
                        <div style="margin-bottom: 8px;">
                            <span style="font-weight: bold;">Field: </span>
                            <span>${props['技术领域']}</span>
                        </div>
                        <div style="margin-bottom: 8px;">
                            <span style="font-weight: bold;">Route: </span>
                            <span>${props['起点']} → ${props['终点']}</span>
                        </div>
                        <div style="margin-bottom: 8px;">
                            <span style="font-weight: bold;">Remarks: </span>
                            <span>${props['备注']}</span>
                        </div>
                    </div>
                `;
                
                const popupCoords = e.lngLat;
                
                console.log('设置并显示弹窗', popupCoords);
                
                // 使用原始的popup对象
                popup.setLngLat(popupCoords)
                    .setHTML(content)
                    .addTo(map);
            });
            
            // 添加鼠标悬停效果
            map.on('mouseenter', layerId, () => {
                map.getCanvas().style.cursor = 'pointer';
            });
            
            map.on('mouseleave', layerId, () => {
                map.getCanvas().style.cursor = '';
            });
            
            console.log(`成功为图层 ${layerId} 添加了点击事件`);
        } else {
            console.error(`图层 ${layerId} 不存在，无法添加点击事件`);
        }
    });
}


// 监听从技术浏览器发来的选中技术事件
window.addEventListener('techSelected', function(e) {
    const techDetail = e.detail;
    console.log('从技术浏览器接收到选中技术事件:', techDetail);
    
    // 根据技术信息找到对应的路线并高亮显示
    // 这里需要根据您的地图组件实现具体的高亮逻辑
    highlightTechRoute(techDetail);
});

// 监听从技术浏览器发来的取消选中事件
window.addEventListener('techDeselected', function() {
    console.log('从技术浏览器接收到取消选中事件');
    
    // 取消所有路线的高亮显示
    // 这里需要根据您的地图组件实现具体的取消高亮逻辑
    resetRouteHighlights();
});

// 在 hky_script.js 中优化的 highlightTechRoute 函数
function highlightTechRoute(techDetail) {
    // 获取技术名称和映射后的时期
    const techName = techDetail.techName;
    const period = techDetail.mappedPeriod || techDetail.period;
    
    console.log(`尝试高亮技术: ${techName}, 时期: ${period}`);
    
    // 查找所有技术路线图层
    const allLayers = Object.keys(map.style._layers);
    const techLayers = allLayers.filter(layerId => 
        layerId.startsWith('technology-route-') && !layerId.includes('arrows')
    );
    const arrowLayers = allLayers.filter(layerId => 
        layerId.startsWith('technology-route-arrows-')
    );
    
    // 先重置所有图层的样式
    resetAllRouteStyles();
    
    // 遍历所有技术路线图层，精确高亮匹配的路线
    let foundMatch = false;
    techLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
            // 使用 filter 属性精确匹配
            const matchingFilter = [
                'all',
                ['==', ['get', '传播内容'], techName],
                ['==', ['get', '朝代'], period]
            ];
            
            // 检查是否有匹配的特征
            const features = map.querySourceFeatures('technology-route', {
                sourceLayer: layerId,
                filter: matchingFilter
            });
            
            if (features && features.length > 0) {
                foundMatch = true;
                
                // 高亮线条
                map.setPaintProperty(layerId, 'line-opacity', [
                    'case',
                    ['all', 
                        ['==', ['get', '传播内容'], techName],
                        ['==', ['get', '朝代'], period]
                    ],
                    1.0,  // 高亮透明度
                    0.1   // 非高亮透明度（更透明）
                ]);
                
                map.setPaintProperty(layerId, 'line-width', [
                    'case',
                    ['all', 
                        ['==', ['get', '传播内容'], techName],
                        ['==', ['get', '朝代'], period]
                    ],
                    6,   // 高亮宽度
                    2    // 非高亮宽度
                ]);
                
                // 为高亮线条添加发光效果
                map.setPaintProperty(layerId, 'line-blur', [
                    'case',
                    ['all', 
                        ['==', ['get', '传播内容'], techName],
                        ['==', ['get', '朝代'], period]
                    ],
                    2,   // 高亮时的模糊效果
                    0    // 非高亮时无模糊
                ]);
            } else {
                // 非匹配的线条设置为半透明
                map.setPaintProperty(layerId, 'line-opacity', 0.1);
                map.setPaintProperty(layerId, 'line-width', 2);
            }
        }
    });
    
    // 处理箭头图层
    arrowLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
            const dynasty = layerId.replace('technology-route-arrows-', '');
            const dynastyColor = getDynastyColor(dynasty);
            
            map.setPaintProperty(layerId, 'text-opacity', [
                'case',
                ['all', 
                    ['==', ['get', '传播内容'], techName],
                    ['==', ['get', '朝代'], period]
                ],
                1.0,  // 高亮时的不透明度
                0.1   // 非高亮时的透明度
            ]);
        }
    });
    
    // 如果找到匹配的路线，聚焦到该路线
    if (foundMatch) {
        focusOnTechRoute(techName, period);
    } else {
        console.log(`未找到匹配的技术路线: ${techName} - ${period}`);
    }
}

// 新增函数：重置所有路线样式
function resetAllRouteStyles() {
    const allLayers = Object.keys(map.style._layers);
    const techLayers = allLayers.filter(layerId => 
        layerId.startsWith('technology-route-')
    );
    
    techLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
            if (layerId.includes('arrows')) {
                // 重置箭头样式
                map.setPaintProperty(layerId, 'text-opacity', 1);
            } else {
                // 重置线条样式
                map.setPaintProperty(layerId, 'line-opacity', 0.7);
                map.setPaintProperty(layerId, 'line-width', 3);
                map.setPaintProperty(layerId, 'line-blur', 0);
            }
        }
    });
}

// 新增函数：聚焦到技术路线
function focusOnTechRoute(techName, period) {
    try {
        const source = map.getSource('technology-route');
        if (source && source._data) {
            const geojsonData = source._data;
            
            // 查找匹配的技术路线
            const techFeature = geojsonData.features.find(feature => 
                feature.properties && 
                feature.properties['传播内容'] === techName &&
                feature.properties['朝代'] === period
            );
            
            if (techFeature && techFeature.geometry) {
                const coordinates = techFeature.geometry.coordinates[0];
                if (coordinates && coordinates.length >= 2) {
                    // 计算路线的边界框
                    const bounds = coordinates.reduce((bounds, coord) => {
                        return [
                            [Math.min(bounds[0][0], coord[0]), Math.min(bounds[0][1], coord[1])],
                            [Math.max(bounds[1][0], coord[0]), Math.max(bounds[1][1], coord[1])]
                        ];
                    }, [[coordinates[0][0], coordinates[0][1]], [coordinates[0][0], coordinates[0][1]]]);
                    
                    // 使用不对称padding，让聚焦中心向左偏移
                    map.fitBounds(bounds, {
                        padding: {
                            top: 150, 
                            bottom: 150, 
                            left: 55,    // 减少左侧padding，内容向左偏移
                            right: 315   // 增加右侧padding，为右侧详情面板留出空间
                        },
                        duration: 2000,
                        maxZoom: 8
                    });
                    
                    console.log(`已聚焦到技术路线: ${techName}`);
                }
            }
        }
    } catch (error) {
        console.error('聚焦路线时出错:', error);
    }
}

// 在 hky_script.js 中优化的 resetRouteHighlights 函数
function resetRouteHighlights() {
    const allLayers = Object.keys(map.style._layers);
    const techLayers = allLayers.filter(layerId => 
        layerId.startsWith('technology-route-')
    );
    
    // 恢复所有技术路线的原始样式
    techLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
            if (layerId.includes('arrows')) {
                // 恢复箭头的原始样式
                map.setPaintProperty(layerId, 'text-opacity', 1);
            } else {
                // 恢复线条的原始样式
                map.setPaintProperty(layerId, 'line-opacity', 0.7);
                map.setPaintProperty(layerId, 'line-width', 3);
                map.setPaintProperty(layerId, 'line-blur', 0);
                
                // 移除任何条件样式
                const dynasty = layerId.replace('technology-route-', '');
                const color = dynasties[dynasty] || '#888888';
                map.setPaintProperty(layerId, 'line-color', color);
            }
        }
    });
    
    // 恢复地图的原始视图
    map.flyTo({
        center: [119.6, 31.9],
        zoom: 6.0,
        pitch: 60,
        bearing: 0,
        duration: 1500
    });
    
    console.log('已重置所有技术路线高亮并恢复地图视图');
}

// 获取朝代颜色的辅助函数
function getDynastyColor(dynasty) {
    const dynastyColors = {
        '隋唐': '#FF5733', 
        '宋': '#33FF57',
        '北宋': '#33FF57',
        '宋元': '#33BBFF',
        '元': '#3357FF',
        '明': '#FF33A1',
        '明清': '#A133FF',
        '元明清': '#7F33FF'
    };
    
    return dynastyColors[dynasty] || '#888888';
}

// 增加从地图点击技术路线时通知技术浏览器的功能
// 修改您现有的setupTechnologyRouteClickHandlers函数
// 在显示popup的同时，触发mapTechSelected事件
function enhanceRouteClickHandlers() {
    const allLayers = Object.keys(map.style._layers);
    const techRouteLayers = allLayers.filter(layerId => 
        layerId.startsWith('technology-route-') && 
        !layerId.includes('arrows')
    );
    
    techRouteLayers.forEach(layerId => {
        map.on('click', layerId, (e) => {
            if (e.features && e.features.length > 0) {
                const feature = e.features[0];
                const techName = feature.properties['传播内容'];
                
                // 触发事件通知技术浏览器
                const event = new CustomEvent('mapTechSelected', {
                    detail: {
                        techName: techName,
                        // 尝试查找匹配的技术ID
                        techId: findTechIdByName(techName)
                    }
                });
                
                window.dispatchEvent(event);
            }
        });
    });
}

// 根据技术名称查找ID的辅助函数
function findTechIdByName(techName) {
    // 这里假设您有一个与tech-explorer.js中相同的技术数据数组
    // 实际使用时您可能需要调整实现方式
    const technologies = [
        // 技术数据...
    ];
    
    const tech = technologies.find(t => t.name === techName);
    return tech ? tech.id : null;
}

// 在地图加载完成后调用增强函数
map.on('load', function() {
    // ... 您现有的代码 ...
    
    // 增强路线点击处理
    setTimeout(() => {
        enhanceRouteClickHandlers();
        console.log('已增强技术路线点击处理');
    }, 1500); // 给予足够时间确保所有图层已加载
});
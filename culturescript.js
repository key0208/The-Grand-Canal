// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 初始化地图
    maptilersdk.config.apiKey = 'y9ojKtjS4KN4UaiG5YUB';
    
    const map = new maptilersdk.Map({
        container: 'map',
        style: 'https://api.maptiler.com/maps/0196a47b-9a4a-7581-85b3-4ad07e239d9a/style.json?key=y9ojKtjS4KN4UaiG5YUB',
        center: [113, 35], 
        zoom: 6,
        maxZoom: 10,
        fillLargeMeshArrays:true
    });
    
    // 全局变量
    let ball = null;
    let animationFrame = null;
    let progress = 0;
    let speed = 7.5;
    let isPaused = false;
    let routePoints = [];
    let totalDistance = 0;
    
    // 等待地图加载完成
    map.on('load', function() {
        console.log('地图加载完成');
        
        // 加载基础数据
        loadCanalData();
        
        
        // 地图加载完成后，自动触发Literature图标的点击事件
setTimeout(() => {
    // 获取Literature图标并模拟点击
    const literatureIcon = document.querySelector('.icon-item:first-child');
    if (literatureIcon) {
        literatureIcon.classList.add('selected'); // 确保添加选中样式
        
        // 直接加载Literature的城市点
        loadIconCities('Literature');
        
        // 加载文字框
        showTextBoxes('Literature', literatureIcon);
    }
    
    // 确保地图处于总览状态
    map.flyTo({
        center: [113, 35],
        zoom: 5,
        pitch: 0,
        bearing: 0,
        duration: 1000
    });
}, 1200);
});
    
    // 为图标添加点击事件
    function initializeIcons() {
        const iconItems = document.querySelectorAll('.icon-item');
        
        iconItems.forEach(item => {
            item.addEventListener('click', function() {
                const iconType = this.querySelector('.icon-text').textContent;
                
                // 移除已有文字框
                document.querySelectorAll('.info-text-box').forEach(box => box.remove());
                
                // 创建新文字框
                showTextBoxes(iconType, this);
                
                // 高亮当前图标
                iconItems.forEach(i => i.classList.remove('selected'));
                this.classList.add('selected');
                
                // 为不同类型的图标加载不同的城市点
                loadIconCities(iconType);
                
                // 重置地图视图到总览状态 
                resetMapToOverview(iconType);
            });
        });
    }
    
    // 执行图标初始化
    setTimeout(initializeIcons, 1000);
    
    
    // 加载运河数据
    function loadCanalData() {
        d3.json('./gjldata/canal.geojson')
            .then(data => {
                console.log('成功加载运河数据');
                
                // 添加数据源
                if (!map.getSource('canal-base-data')) {
                    map.addSource('canal-base-data', {
                        type: 'geojson',
                        data: data
                    });
                    
                    // 添加运河线图层
                    map.addLayer({
                        id: 'canal-base-line',
                        type: 'line',
                        source: 'canal-base-data',
                        layout: {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        paint: {
                            'line-color': '#2f639a',
                            'line-width': 3,
                            'line-opacity': 0.8
                        }
                    });
                    
                    // 添加水墨效果
                    map.addLayer({
                        'id': 'canal-ink-edge',
                        'type': 'line',
                        'source': 'canal-base-data',
                        'paint': {
                            'line-color': '#0A2D52',
                            'line-width': 3,
                            'line-blur': 3,
                            'line-opacity': 0.3
                        }
                    }, 'canal-base-line');
                }
            })
            .catch(error => {
                console.error('加载运河数据失败:', error);
            });
    }
    
    // 添加图例函数
function addMapLegend() {
    // 移除可能已存在的图例
    const existingLegend = document.getElementById('map-legend');
    if (existingLegend) {
        existingLegend.remove();
    }
    
    // 移除可能已存在的分割线
    const existingDividers = document.querySelectorAll('.legend-divider');
    existingDividers.forEach(div => div.remove());
    
    // 创建分割线元素 - 给一个特殊的类名便于调试
    const legendDivider = document.createElement('div');
    legendDivider.className = 'divider legend-divider';
    legendDivider.style.height = '2px';
    legendDivider.style.backgroundColor = 'rgba(189, 172, 135, 0.7)';
    legendDivider.style.margin = '30px 0 20px 0';
    legendDivider.style.width = '97%';
    // 增加重要的样式确保可见
    legendDivider.style.display = 'block';
    legendDivider.style.clear = 'both';
    legendDivider.style.position = 'relative';
    legendDivider.style.zIndex = '999';

    
    // 创建图例元素
    const legendDiv = document.createElement('div');
    legendDiv.id = 'map-legend';
    legendDiv.className = 'map-legend';
    
        // 添加样式 - 调整与文本框和source的距离
    legendDiv.style.marginTop = '20px'; // 增加与文本框的距离
    legendDiv.style.marginBottom = '-10px'; // 减少与source的距离
    
    
    // 添加HTML内容
    legendDiv.innerHTML = `
        <h3 class="legend-title">Legend</h3>
        <div class="legend-item">
            <div class="legend-color" style="background-color: #2f639a;"></div>
            <div class="legend-label">Grand Canal</div>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: #e66101;"></div>
            <div class="legend-label">Literature Dissemination</div>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: #e31a1c;"></div>
            <div class="legend-label">Opera Transmission Route</div>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: #ffed6f;"></div>
            <div class="legend-label">Diet Culture Exchange</div>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: #fb9a99;"></div>
            <div class="legend-label">Dialect Spread</div>
        </div>
        <div class="legend-item">
            <div class="legend-icon">
                <img src="gjlimages/city_symbol.png" alt="City Node">
            </div>
            <div class="legend-label">Important Cities</div>
        </div>
        <div class="legend-item">
            <div class="legend-icon">
                <img src="gjlimages/ship.png" alt="Transportation Medium">
            </div>
            <div class="legend-label">Cultural Carrier</div>
        </div>
    `;

    // 获取source元素
    const sourceElement = document.querySelector('.source');
    
    // 获取console元素
    const consoleElement = document.getElementById('console');
    const textBoxesContainer = document.querySelector('.text-boxes-container');
    
if (sourceElement && consoleElement) {
        // 如果找到了文本框容器，直接在其后面添加分割线，确保视觉上分割线在文本框下方
        if (textBoxesContainer) {
            // 在控制台上打印一些信息以确认
            console.log('找到文本框容器', textBoxesContainer);
            
            // 直接在文本框容器之后插入分割线
            textBoxesContainer.after(legendDivider);
            
            // 在分割线之后插入图例
            legendDivider.after(legendDiv);
        } else {
            // 如果没有找到文本框容器，则按原计划在source元素之前插入
            console.log('未找到文本框容器，使用备用方法');
            consoleElement.insertBefore(legendDivider, sourceElement);
            consoleElement.insertBefore(legendDiv, sourceElement);
        }
        
        console.log('成功添加图例和分割线');
    } else {
        console.log('未找到必要的DOM元素');
    }
    
    // 添加一个延迟检查，确认分割线是否真的被添加到了DOM中
    setTimeout(() => {
        const dividerAdded = document.querySelector('.legend-divider');
        console.log('分割线元素存在: ', !!dividerAdded);
        if (dividerAdded) {
            console.log('分割线样式:', {
                display: window.getComputedStyle(dividerAdded).display,
                height: window.getComputedStyle(dividerAdded).height,
                backgroundColor: window.getComputedStyle(dividerAdded).backgroundColor,
                margin: window.getComputedStyle(dividerAdded).margin,
                width: window.getComputedStyle(dividerAdded).width
            });
        }
    }, 500);
}
    
// 根据图标类型加载城市点
function loadIconCities(iconType) {
    // Remove existing city markers
    removeExistingCityMarkers();
    
    // 根据不同的图标类型加载不同的城市点文件
    let cityFile;
    
    switch(iconType) {
        case 'Literature':
            cityFile = './gjldata/literature_cities.json';
            break;
        case 'Opera':
            cityFile = './gjldata/opera_cities.json';
            break;
        case 'Diet':
            cityFile = './gjldata/diet_cities.json';
            break;
        case 'Dialect':
            cityFile = './gjldata/dialect_cities.json';
            break;
        default:

            return;
    }
    
    // 加载城市点
    loadCityNodes(cityFile, 'icon');
}
    // 重置地图到总览视图
function resetMapToOverview(iconType) {
    // 停止当前动画
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
    
    // 移除现有路线和球
    safelyRemoveRoute();
    if (ball) {
        ball.remove();
        ball = null;
    }
    
    // 根据不同类型设置不同的中心点和缩放级别
    let center = [113, 35]; // 默认中心
    let zoom = 5;          // 默认缩放级别
    
    // 可以为每个类型调整不同的中心点
    switch(iconType) {
        case 'Literature':
            center = [113, 35];
            zoom = 5;
            break;
        case 'Opera':
            center = [113, 35];
            zoom = 5;
            break;
        case 'Diet':
            center = [113, 35];
            zoom = 5;
            break;
        case 'Dialect':
            center = [116, 35];
            zoom = 5;
            break;
    }
    
    // 飞行到总览视图
    map.flyTo({
        center: center,
        zoom: zoom,
        pitch: 0,         // 平面视图
        bearing: 0,       // 正北朝上
        duration: 1500
    });
}
    
    // 显示文字框
    function showTextBoxes(iconType, iconElement) {
        console.log('显示文字框:', iconType);
        
        // 文字内容
        let textBoxContents = [];
        let animationRoutes = [];
        
        // 根据图标类型准备内容
        if (iconType === 'Literature') {
            textBoxContents = [
                '1140 - Formation of Jiangnan Poetry School',
                '1620 - Tongcheng School prose',
                '1791 - Dissemination of Dream of the Red Chamber'
            ];
            animationRoutes = [
                {type: 'jiangnan', 
                 file: './gjldata/jiangnan.geojson',
                 color: '#e66101',
                 icon:'gjlimages/ship.png',
                 view:{zoom: 7.5, pitch: 30, bearing: 20},
                 cityNodes: './gjldata/jiangnan_city.geojson'
                },
                {type: 'tongcheng', 
                 file: './gjldata/huiban.geojson', 
                 color: '#e66101',
                 icon:'gjlimages/ship.png',
                 view:{zoom: 5.8, pitch: 30, bearing: 20},
                 cityNodes: './gjldata/tongcheng_city.geojson'},
                
                {type: 'red_chamber', 
                 file: './gjldata/red.geojson', 
                 color: '#e66101',
                 icon:'gjlimages/ship.png',
                 view:{zoom: 5.7, pitch: 30, bearing: 20},
                 cityNodes: './gjldata/red_city.geojson'
                }
            ];
        } else if (iconType === 'Opera') {
            textBoxContents = [
                '980 - Refinement of Bianjing Zaju Opera',
                '1280 - Integration of Zaju and Nanxi',
                '1590 - Northward Spread of Kunqu Opera'
            ];
            animationRoutes = [
                {type: 'zaju', 
                 file: './gjldata/zaju_route.geojson', 
                 color: '#e31a1c',
                 icon:'gjlimages/ship.png',
                 view:{zoom: 8, pitch: 30, bearing: 20},
                 cityNodes: './gjldata/zaju_city.geojson'
                },
                
                {type: 'nanxi', 
                 file: './gjldata/nanyi2.geojson', 
                 color: '#e31a1c',
                icon:'gjlimages/ship.png',
                 view:{zoom: 6, pitch: 30, bearing: 20},
                 cityNodes: './gjldata/nanyi_city.geojson'},
                
                {type: 'huiban', 
                 file: './gjldata/huiban.geojson', 
                 color: '#e31a1c', 
                 icon: 'gjlimages/ship.png',
                 view:{zoom: 5.8, pitch: 30, bearing: 20},
                 cityNodes: './gjldata/huiban_city.geojson'}
            ];
        } else if (iconType === 'Diet') {
            textBoxContents = [
                '980 - Northward Spread of Tea Culture',
                '1550 - Southward Spread of Northern Flour-based Food',
                '1720 - Southward Spread of Official-style Cuisine'     
            ];
            animationRoutes = [                
                {type: 'tea', 
                 file: './gjldata/tea.geojson', 
                 color: '#ffed6f',
                 icon: 'gjlimages/ship.png',// 移动的icon
                 view:{zoom: 5.5, pitch: 20, bearing: 20},// 添加视图参数
                 cityNodes: './gjldata/tea_city.geojson'
                },
                
                {type: 'noodles', 
                 file: './gjldata/noodles.geojson', 
                 color: '#ffed6f',
                icon: 'gjlimages/ship.png',// 移动的icon
                 view:{zoom: 6.5, pitch: 30, bearing: 20},// 添加视图参数
                 cityNodes: './gjldata/noodles_city.geojson'}, 
                
                {type: 'palace-cuisin',
                 file: './gjldata/palace_cuisin.geojson',
                 color: '#e19c41',                 
                 icon: 'gjlimages/ship.png',// 移动的icon
                 view:{zoom: 5.9, pitch: 20, bearing: 20},// 添加视图参数
                 cityNodes: './gjldata/palace_city.geojson'
                },

            ];
        } else if (iconType === 'Dialect') {
            textBoxContents = [
                '1420 - Northern Mandarin Heartland',
                '1500 - Transition Zone Between Mandarin and Southern Dialects',
                '1700 - Mandarinization of Nan Opera'
            ];
            animationRoutes = [
                {type: 'mandarin', 
                 file: './gjldata/mandarin.geojson', 
                 color: '#fb9a99',
                 icon: 'gjlimages/ship.png',// 移动的icon
                 view:{zoom: 6.3, pitch: 30, bearing: 20},// 添加视图参数
                 cityNodes: './gjldata/mandarin_city.geojson'// 添加重要城市节点
                },
                {type: 'guodu', 
                 file: './gjldata/guodu.geojson', 
                 color: '#fb9a99',
                 icon: 'gjlimages/ship.png',// 移动的icon
                 view:{zoom: 6.8, pitch: 30, bearing: 20},// 添加视图参数
                 cityNodes: './gjldata/guodu_city.geojson'},// 添加重要城市节点}
                {type: 'wu', 
                 file: './gjldata/wu.geojson', 
                 color: '#fb9a99',
                 icon: 'gjlimages/ship.png',// 移动的icon
                 view:{zoom: 8, pitch: 30, bearing: 20},// 添加视图参数
                 cityNodes: './gjldata/wu_city.geojson'// 添加重要城市节点
                }
            ];
        } else {
            textBoxContents = [
                `关于${iconType}的信息一`,
                `关于${iconType}的信息二`,
                `关于${iconType}的信息三`
            ];
            animationRoutes = [
                {type: 'default1', file: './gjldata/default_route1.geojson', color: '#4682B4'},
                {type: 'default2', file: './gjldata/default_route2.geojson', color: '#1E90FF'},
                {type: 'default3', file: './gjldata/default_route3.geojson', color: '#00BFFF'}
            ];
        }
        
        // 创建文字框容器
        const consoleElement = document.getElementById('console');
        if (!consoleElement) return;
        
        const boxesContainer = document.createElement('div');
        boxesContainer.className = 'text-boxes-container';
        boxesContainer.style.position = 'relative';
        boxesContainer.style.zIndex = '1000';
        boxesContainer.style.marginTop = '10px';
        
        
        // 移除已有文字框
        document.querySelectorAll('.info-text-box').forEach(box => box.remove());
        document.querySelectorAll('.text-boxes-container').forEach(container => container.remove());
        
        // 插入文字框容器
        const sliderContainer = document.querySelector('.slider-container');
        const sourceElement = document.querySelector('.source');
        
        if (sliderContainer && sourceElement && sliderContainer.parentNode === sourceElement.parentNode) {
            sliderContainer.parentNode.insertBefore(boxesContainer, sourceElement);
        } else {
            consoleElement.appendChild(boxesContainer);
        }
        
        // 创建文字框
        textBoxContents.forEach((text, index) => {
            const textBox = document.createElement('div');
            textBox.className = 'info-text-box';
            textBox.textContent = text;
            textBox.style.opacity = '1';
            textBox.style.cursor = 'pointer';
            textBox.style.width = '90%';
            
            // 存储路线信息
            if (animationRoutes[index]) {
                const routeData = animationRoutes[index];
                textBox.dataset.animationType = routeData.type;
                textBox.dataset.geoJsonFile = routeData.file;
                textBox.dataset.routeColor = routeData.color;
                textBox.dataset.iconImage = routeData.icon;
                
            // 添加视图参数到dataset
                if (routeData.view) {
                    textBox.dataset.viewZoom = routeData.view.zoom;
                    textBox.dataset.viewPitch = routeData.view.pitch;
                    textBox.dataset.viewBearing = routeData.view.bearing;
                   }
                
            // 添加城市节点数据属性
                if (routeData.cityNodes) {
                    textBox.dataset.cityNodesFile = routeData.cityNodes;}
                
                // 添加点击事件
                textBox.addEventListener('click', function() {
                    // 高亮当前文字框
                    document.querySelectorAll('.info-text-box').forEach(box => {
                        box.classList.remove('active');
                    });
                    this.classList.add('active');
                    
                    // 添加点击效果
                    this.classList.add('clicked');
                    setTimeout(() => {
                        this.classList.remove('clicked');
                    }, 300);
                    
                        // 准备视图参数
                    const viewParams = {
                        zoom: this.dataset.viewZoom ? parseFloat(this.dataset.viewZoom) : 7,
                        pitch: this.dataset.viewPitch ? parseFloat(this.dataset.viewPitch) : 45,
                        bearing: this.dataset.viewBearing ? parseFloat(this.dataset.viewBearing) : 30
                    };
                    
                    // 加载路线
                    loadRoute(
                        this.dataset.animationType,
                        this.dataset.geoJsonFile,
                        this.dataset.routeColor,
                        this.dataset.iconImage,
                        viewParams
                    );
                    
                    // 检查是否需要加载城市节点
                    if (this.dataset.cityNodesFile) {
                        loadCityNodes(this.dataset.cityNodesFile, 'textbox');
                    }else {
                        // 如果没有城市节点文件，则清除现有的城市标记
                        removeExistingCityMarkers();
}
                    
                });
            }
            
            // 添加鼠标悬停效果
            textBox.addEventListener('mouseenter', function() {
                this.style.backgroundColor = 'rgba(240, 230, 205, 0.95)';
                this.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.2)';
                this.style.transform = 'translateY(-2px)';
            });
            
            textBox.addEventListener('mouseleave', function() {
                if (!this.classList.contains('active')) {
                    this.style.backgroundColor = 'rgba(255, 245, 220, 0.95)';
                    this.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
                    this.style.transform = 'translateY(0)';
                }
            });
            
            boxesContainer.appendChild(textBox);
        });
        addMapLegend();
        
        console.log('文字框创建完成');
    }
    
    // 加载城市节点函数
function loadCityNodes(file, source = 'icon') {
    console.log(`加载城市节点数据: ${file}, 来源: ${source}`);
    
    // Remove existing city markers
    removeExistingCityMarkers();
    
    // Load GeoJSON
    d3.json(file)
        .then(data => {
            console.log('成功加载城市节点数据:', data);
            
            // Process each city point
            if (data.features && data.features.length > 0) {
                data.features.forEach(feature => {
                    if (feature.geometry && feature.geometry.type === 'Point') {
                        const coordinates = feature.geometry.coordinates;
                        const properties = feature.properties || {};
                        
                        // 创建卷轴信息卡
                        createCityMarker(coordinates, properties, source);
                    }
                });
            }
        })
        .catch(error => {
            console.error('无法加载城市节点数据:', error);
            showErrorMessage('无法加载城市节点数据');
        });
}

// 移除现有的城市标记
function removeExistingCityMarkers() {
    // 获取所有城市标记元素
    const cityMarkers = document.querySelectorAll('.city-scroll-marker');
    cityMarkers.forEach(marker => {
        marker.remove();
    });
}

// 创建城市标记
function createCityMarker(coordinates, properties, source = 'icon') {
    // 创建标记容器
    const markerElement = document.createElement('div');
    markerElement.className = 'city-scroll-marker';
    
    // Create scroll image
    const scrollImage = document.createElement('img');
    scrollImage.alt = properties.City || '城市信息';

    const hasCustomIcon = properties.iconImage && properties.iconImage.trim() !== '';
    
    if (hasCustomIcon) {
        // Use specific icon
        scrollImage.src = properties.iconImage;
        scrollImage.style.width = '55px'; 
        scrollImage.style.height = '55px';
    } else {
        // Use default icon
        scrollImage.src = 'gjlimages/city_symbol.png';
        scrollImage.style.width = '40px';  
        scrollImage.style.height = '40px';
    }
    scrollImage.style.objectFit = 'contain';
    scrollImage.style.marginBottom = '0'; 
    scrollImage.style.cursor = 'pointer'; 
    
    // Add image to marker container
    markerElement.appendChild(scrollImage);
    
    // Create city name label
    const cityLabel = document.createElement('div');
    cityLabel.className = 'city-label';
    cityLabel.textContent = properties.City || '未知城市';
    cityLabel.style.position = 'absolute'; 
    cityLabel.style.bottom = '-20px'; // 将标签定位到图标底部下方
    cityLabel.style.textAlign = 'center';
    cityLabel.style.fontSize = '16px';
    cityLabel.style.fontWeight = 'bold';
    cityLabel.style.color = '#5D4037';
    cityLabel.style.marginTop = '5px';
    cityLabel.style.textShadow = '1px 1px 2px rgba(255,255,255,0.7)';
    cityLabel.style.padding = '2px 5px';
    cityLabel.style.borderRadius = '3px';
    cityLabel.style.width = 'max-content';
    cityLabel.style.margin = '5px auto 0 auto';
    
    
    // 将标签添加到标记容器
    markerElement.appendChild(cityLabel);
    
    // 创建信息弹窗
// 创建信息弹窗
const popup = document.createElement('div');
popup.className = 'city-info-popup';

// 根据source类型设置不同的样式
if (source === 'textbox') {
    popup.classList.add('textbox-source');
popup.style.maxWidth = '320px';        // 更宽
    popup.style.maxHeight = '380px'; 
    popup.style.padding = '18px 14px';
    popup.style.fontSize = '13px'
} else {
    popup.classList.add('icon-source');
  popup.style.maxWidth = '320px';        // 更宽
    popup.style.maxHeight = '380px'; 
    popup.style.padding = '10px';
    popup.style.fontSize = '12px';
}

popup.style.display = 'none';
popup.style.position = 'absolute';
popup.style.left = '50%';
popup.style.transform = 'translateX(-50%)';
popup.style.backgroundImage = 'url(gjlimages/scroll9.png)';
popup.style.backgroundSize = '100% 100%';
popup.style.zIndex = '1040';
popup.style.overflowY = 'auto';
popup.style.textAlign = 'center';
popup.style.boxSizing = 'border-box';
popup.style.wordWrap = 'break-word';
popup.style.overflowWrap = 'break-word';
    
    // Add close button
    const closeButton = document.createElement('div');
    closeButton.className = 'popup-close-button';
    closeButton.innerHTML = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.right = '10px';
    closeButton.style.fontSize = '16px';
    closeButton.style.fontWeight = 'bold';
    closeButton.style.color = '#5D4037';
    closeButton.style.cursor = 'pointer';
    closeButton.style.width = '20px';
    closeButton.style.height = '20px';
    closeButton.style.lineHeight = '20px';
    closeButton.style.textAlign = 'center';
    closeButton.style.borderRadius = '50%';
    closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    
    // Add close button hover effect
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    });
    
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    });
    
        // Create popup content based on source
    if (source === 'textbox') {
        // Create expanded content for text box source
        
        // Add city name
        const cityName = document.createElement('h4');
        cityName.textContent = properties.City || '未知城市';
        cityName.style.margin = '0 0 5px 0';
        cityName.style.color = '#5D4037';
        
// Create sections for each field with improved styling
const createSection = (label, value) => {
    if (!value) return null;
    
    const section = document.createElement('div');
    section.style.marginBottom = '10px';
    section.style.textAlign = 'left';
    section.style.lineHeight = '1.4';
    section.style.wordWrap = 'break-word';
    section.style.overflowWrap = 'break-word';
    section.style.width = '100%';
    section.style.boxSizing = 'border-box';
    
    const labelElem = document.createElement('div');
    labelElem.innerHTML = `<strong>${label}:</strong>`;
    labelElem.style.color = '#5D4037';
    labelElem.style.fontSize = '13px';
    labelElem.style.marginBottom = '2px';
    labelElem.style.wordWrap = 'break-word';
    
    const valueElem = document.createElement('div');
    valueElem.textContent = value;
    valueElem.style.color = '#6D4C41';
    valueElem.style.fontSize = '11px';
    valueElem.style.wordWrap = 'break-word';
    valueElem.style.overflowWrap = 'break-word';
    valueElem.style.whiteSpace = 'normal';
    valueElem.style.width = '100%';
    valueElem.style.boxSizing = 'border-box';
    
    section.appendChild(labelElem);
    section.appendChild(valueElem);
    
    return section;
};
        
        // Add all sections
        const character = createSection('Character', properties.character);
        const resource = createSection('Resource', properties.resource);
        const contribution = createSection('Contribution', properties.contribution);
        //const people = createSection('People', properties.people);
        
        // Assemble popup
        popup.appendChild(closeButton);
        popup.appendChild(cityName);
        
        if (character) popup.appendChild(character);
        if (resource) popup.appendChild(resource);
        if (contribution) popup.appendChild(contribution);
        //if (people) popup.appendChild(people);
        
        // Add a fallback description if no specific fields are provided
        if (!character && !resource && !contribution && !people) {
            const cityDesc = document.createElement('p');
            cityDesc.textContent = properties.description || '此地是运河沿线重要的瓷器贸易中心。';
            cityDesc.style.margin = '0';
            cityDesc.style.fontSize = '12px';
            cityDesc.style.color = '#6D4C41';
            popup.appendChild(cityDesc);
        }
    } else {
    
    // 添加城市名称
    const cityName = document.createElement('h4');
    cityName.textContent = properties.City || '未知城市';
    cityName.style.margin = '0 0 5px 0';
    cityName.style.color = '#5D4037';
    
    // 添加城市描述
    const cityDesc = document.createElement('p');
    cityDesc.textContent = properties.description || '此地是运河沿线重要的瓷器贸易中心。';
    cityDesc.style.margin = '0';
    cityDesc.style.fontSize = '12px';
    cityDesc.style.color = '#6D4C41';
    
    // 组装弹窗
    popup.appendChild(closeButton); 
    popup.appendChild(cityName);
    popup.appendChild(cityDesc);
    }
    
    document.body.appendChild(popup);
    
    // 移除悬停事件，改为纯点击交互
markerElement.addEventListener('click', (e) => {
    // 阻止事件冒泡，防止地图点击事件被触发
    e.stopPropagation();
    
    // 检查点击是否来自关闭按钮
    if (e.target === closeButton) {
        popup.style.display = 'none';
        return;
    }
    
    // 处理弹窗显示/隐藏
    if (popup.style.display === 'block') {
        popup.style.display = 'none';
    } else {
        // 关闭所有其他弹窗
        document.querySelectorAll('.city-info-popup').forEach(p => {
            p.style.display = 'none';
        });
        popup.style.display = 'block';
        markerElement.style.zIndex = '1001';
        // 判断图标在屏幕上的位置
        const markerRect = markerElement.getBoundingClientRect();
        const popupHeight = popup.offsetHeight || 220;
        const popupWidth = popup.offsetWidth || 200;
        const iconCenterX = markerRect.left + markerRect.width / 2;
        // 设置 popup 的绝对位置
        popup.style.position = 'absolute';
        popup.style.left = `${iconCenterX - popupWidth / 2}px`;
        popup.style.top = `${markerRect.top - popupHeight}px`;
        
        if (markerRect.top < popupHeight + 10) {
            // 如果靠近页面上边缘，把popup放在下方
           popup.style.top = `${markerRect.bottom }px`;
        } else {
            // 否则默认放在上方
            popup.style.top = `${markerRect.top - popupHeight - 2}px`;
}
    }
});
    
    // 关闭按钮点击事件
    closeButton.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡
        popup.style.display = 'none';
        markerElement.style.zIndex = '1000';
    });
    
    // 点击地图其他区域关闭所有弹窗
    map.getCanvas().addEventListener('click', () => {
        document.querySelectorAll('.city-info-popup').forEach(p => {
            p.style.display = 'none';
        });
        markerElement.style.zIndex = '1000';
    });
    
    // 使用MapTiler的Marker添加到地图
    new maptilersdk.Marker({
        element: markerElement
        
    })
    .setLngLat(coordinates)
    .addTo(map);
}
    
// 加载路线
function loadRoute(type, file, color, iconImage,viewParams) {
        console.log(`加载路线: ${type}, 文件: ${file}, 图标: ${iconImage}`);
        
        // 停止当前动画
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
        
        // 移除现有路线和球
        safelyRemoveRoute();
        if (ball) {
            ball.remove();
            ball = null;
        }
        
        // 加载GeoJSON
        const sourceId = `route-${type}`;
        const layerId = `line-${type}`;
        
        d3.json(file)
            .then(data => {
                console.log('成功加载路线数据');
                
                try {
                    // 添加数据源
                    map.addSource(sourceId, {
                        type: 'geojson',
                        data: data
                    });                
                    
                    // 添加动态效果底层
                    map.addLayer({
                    id: `${layerId}-glow`,
                    type: 'line',
                    source: sourceId,
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': color || '#BD7446',
                        'line-width': 12,
                        'line-opacity': 0.35,
                        'line-blur': 5
                    }
                });
                    
                    
                    // 添加路线图层
                    map.addLayer({
                        id: layerId,
                        type: 'line',
                        source: sourceId,
                        layout: {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        paint: {
                            'line-color': color || '#BD7446',
                            'line-width': 3,
                            'line-opacity': 0.9,
                            
                        }
                    });
                    
                    // 添加边缘轮廓 - 增加清晰度
                map.addLayer({
                    id: `${layerId}-outline`,
                    type: 'line',
                    source: sourceId,
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': '#ffffff',
                        'line-width': 6,
                        'line-opacity': 0.5,
                        'line-gap-width': 4
                    }
                }, `${layerId}-glow`);
                    
               // 添加动画渐入效果
                map.setPaintProperty(`${layerId}-glow`, 'line-opacity', 0);
                map.setPaintProperty(layerId, 'line-opacity', 0);
                map.setPaintProperty(`${layerId}-outline`, 'line-opacity', 0);
                
                setTimeout(() => {
                    map.setPaintProperty(`${layerId}-glow`, 'line-opacity', 0.15);
                    map.setPaintProperty(layerId, 'line-opacity', 0.9);
                    map.setPaintProperty(`${layerId}-outline`, 'line-opacity', 0.5);
                }, 300);
                    
                    // 提取路线点
                    extractRoutePoints(data);
                    
                    // 如果有路线点，创建球和开始动画
                    if (routePoints.length > 0) {
                        // 创建球
                        createBall(iconImage);
                        
                        // 飞行到合适的位置
                        flyToRoute(viewParams);
                        
                        // 开始动画
                        startAnimation();
                    }
                } catch (error) {
                    console.error('加载路线图层出错:', error);
                    showErrorMessage('无法加载路线');
                }
            })
            .catch(error => {
                console.error('无法加载GeoJSON:', error);
                showErrorMessage(`无法加载路线: ${type}`);
            });
    }
    
    // 安全地移除路线
    function safelyRemoveRoute() {
        try {
            // 获取所有图层
            const layers = map.getStyle().layers || [];
            
            // 找出路线图层
            const routeLayers = layers.filter(layer => 
                layer.id.startsWith('line-') || 
                layer.id.startsWith('route-')
            );
            
            // 移除图层
            routeLayers.forEach(layer => {
                if (map.getLayer(layer.id)) {
                    try {
                        map.removeLayer(layer.id);
                    } catch (e) {
                        console.warn(`移除图层 ${layer.id} 失败:`, e);
                    }
                }
            });
            
            // 移除数据源
            const sourceIds = routeLayers.map(layer => layer.source).filter(Boolean);
            new Set(sourceIds).forEach(sourceId => {
                if (map.getSource(sourceId)) {
                    try {
                        map.removeSource(sourceId);
                    } catch (e) {
                        console.warn(`移除数据源 ${sourceId} 失败:`, e);
                    }
                }
            });
        } catch (error) {
            console.error('移除路线出错:', error);
        }
    }
    
    // 提取路线点
    function extractRoutePoints(data) {
        routePoints = [];
        if (data.features && data.features.length > 0) {
            const geometry = data.features[0].geometry;
            if (geometry.type === 'MultiLineString') {
                routePoints = geometry.coordinates[0];
            } else if (geometry.type === 'LineString') {
                routePoints = geometry.coordinates;
            }
        }
        
        // 计算总距离
        if (routePoints.length > 0) {
            totalDistance = 0;
            for (let i = 0; i < routePoints.length - 1; i++) {
                totalDistance += calculateDistance(routePoints[i], routePoints[i + 1]);
            }
        }
    }
    
    // 创建球
    function createBall(iconImage) {
        if (routePoints.length === 0) return;
        
        const el = document.createElement('div');
        el.className = 'bowl-marker';
// 使用特定图标
    const defaultIcon = 'gjlimages/袁枚_Qw.png'; // 默认图标
    el.innerHTML = `<img src="${iconImage || defaultIcon}" style="width: 150%; height: 150%;">`;
        
        ball = new maptilersdk.Marker({ element: el })
            .setLngLat(routePoints[0])
            .addTo(map);
    }
    
    // 飞行到路线
    function flyToRoute(viewParams) {
        if (routePoints.length === 0) return;
        
        const startPoint = routePoints[0];
        const endPoint = routePoints[routePoints.length - 1];
        const basicCenterPoint = [
            (startPoint[0] + endPoint[0]) / 2,
            (startPoint[1] + endPoint[1]) / 2
        ];
        
        // 获取地图容器宽度
    const mapWidth = map.getContainer().offsetWidth;
    
    // 计算左侧面板占比
    const leftPanelWidthRatio = 350 / mapWidth;
    
    
    // 计算经度跨度
    const longitudeSpan = Math.abs(endPoint[0] - startPoint[0]);
        
        // 使用基于经度跨度的动态偏移
    const dynamicOffset = longitudeSpan * leftPanelWidthRatio * 0.1;
    
    // 添加固定偏移量 - 这里添加2度的经度偏移
    const fixedOffset = -1.0;
    
    // 计算调整后的中心点
    const adjustedCenterPoint = [
        basicCenterPoint[0] + dynamicOffset + fixedOffset,
        basicCenterPoint[1]
    ];
        
        // 使用传入的视图参数或默认值
    const zoom = viewParams && viewParams.zoom ? parseFloat(viewParams.zoom) : 7;
    const pitch = viewParams && viewParams.pitch ? parseFloat(viewParams.pitch) : 45;
    const bearing = viewParams && viewParams.bearing ? parseFloat(viewParams.bearing) : 30;
        
        map.flyTo({
            center: adjustedCenterPoint,
            zoom: zoom,
            pitch: pitch,
            bearing: bearing,
            duration: 1500
        });
    }
    
    // 开始动画
    function startAnimation() {
        progress = 0;
        isPaused = false;
        
        setTimeout(() => {
            if (!animationFrame) {
                animate();
            }
        }, 1800);
    }
    
    // 动画函数
    function animate() {
        if (!isPaused && progress < 1) {
            progress += 0.0001 * speed;
            if (progress > 1) progress = 1;
            
            const currentDistance = totalDistance * progress;
            const currentPoint = getPointAtDistance(currentDistance);
            
            if (ball) {
                ball.setLngLat(currentPoint);
            }
            
            animationFrame = requestAnimationFrame(animate);
        }
    }
    
    
    
    // 计算两点距离
    function calculateDistance(point1, point2) {
        const R = 6371;
        const lat1 = point1[1] * Math.PI / 180;
        const lat2 = point2[1] * Math.PI / 180;
        const deltaLat = (point2[1] - point1[1]) * Math.PI / 180;
        const deltaLon = (point2[0] - point1[0]) * Math.PI / 180;
        
        const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
    
    // 获取指定距离的点
    function getPointAtDistance(targetDistance) {
        let currentDistance = 0;
        for (let i = 0; i < routePoints.length - 1; i++) {
            const segmentDistance = calculateDistance(routePoints[i], routePoints[i + 1]);
            
            if (currentDistance + segmentDistance >= targetDistance) {
                const remainingDistance = targetDistance - currentDistance;
                const segmentProgress = remainingDistance / segmentDistance;
                
                return [
                    routePoints[i][0] + (routePoints[i + 1][0] - routePoints[i][0]) * segmentProgress,
                    routePoints[i][1] + (routePoints[i + 1][1] - routePoints[i][1]) * segmentProgress
                ];
            }
            
            currentDistance += segmentDistance;
        }
        
        return routePoints[routePoints.length - 1];
    }
    
    // 显示错误信息
    function showErrorMessage(message) {
        const consoleElement = document.getElementById('console');
        if (!consoleElement) return;
        
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = message;
        errorMsg.style.backgroundColor = 'rgba(255,200,200,0.9)';
        errorMsg.style.color = '#721c24';
        errorMsg.style.padding = '10px';
        errorMsg.style.borderRadius = '4px';
        errorMsg.style.marginTop = '10px';
        errorMsg.style.fontWeight = 'bold';
        
        consoleElement.appendChild(errorMsg);
        
        setTimeout(() => {
            errorMsg.style.opacity = '0';
            errorMsg.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                if (errorMsg.parentNode) {
                    errorMsg.parentNode.removeChild(errorMsg);
                }
            }, 500);
        }, 3000);
    }
});
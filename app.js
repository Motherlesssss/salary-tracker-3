// ============== 全局状态 ==============
const state = {
    uploadedData: null,      // 原始上传的数据
    aggregatedData: null,    // 按日期+车型聚合的数据
    targetYear: new Date().getFullYear(),
    targetMonth: new Date().getMonth() + 1,
    specialEvents: [],       // 自定义特殊节点
    currentVehicle: null,    // 当前查看的车型
    results: null,           // 生成的比例结果
    ignoreHistoryData: false, // 是否忽略历史同期数据
    weightMultipliers: {     // 权重调整倍数
        weekday: 1.0,        // 工作日倍数
        weekend: 1.0,        // 周末倍数
        holiday: 1.0         // 节假日倍数
    },
    vehicleTargets: {},      // 各车型月度目标量 { vehicle: number }
    selectedRegion: null,    // 选中的区域
    storeAllocations: {},    // 各门店的月度目标分配 { storeName: number }
    storeData: {},           // 门店详细数据 { storeName: { vehicles, dailyTotals, monthlyTarget, adjustments } }
    vehiclesUsingAverageRatio: [],  // 使用平均比例的车型列表

    // ============== 工作流状态管理（新增）==============
    workflow: {
        regionSelected: false,     // 步骤1：区域已选
        dataUploaded: false,       // 步骤2：数据已上传
        vehiclesConfigured: false, // 步骤2.5：车型已确认
        monthSelected: false,      // 步骤3：月份已选
        ratiosGenerated: false     // 步骤5：比例已生成
    },
    vehicleConfig: {},            // 车型详细配置 { vehicleCode: { name, type, enabled, ... } }
    enabledVehicleCount: 0        // 启用的车型数量
};

// ============== 区域和门店数据 ==============
const regionsData = {
    "北京战区": {
        stores: [
            "北京祥云小镇",
            "北京来广营汽车城",
            "北京金港汽车园",
            "北京通州北苑",
            "北京华熙LIVE",
            "北京博瑞汽车园",
            "北京世纪金源",
            "北京清河万象汇",
            "北京超极合生汇",
            "北京西红门荟聚",
            "北京石景山国际汽贸园",
            "北京龙湖亦庄天街",
            "北京百旺绿谷汽车园",
            "北京龙湖房山熙悦天街",
            "北京首钢园六工汇",
            "北京五方天雅汽车园",
            "北京朝阳合生汇",
            "北京颐堤港",
            "北京蓝色港湾",
            "北京东坝万达"
        ]
    },
    "浙江大区": {
        stores: [
            "温州印象城",
            "龙湾万达",
            "温州瑞安汽车城",
            "温州苍南银泰城",
            "温州鹿城",
            "温州乐清",
            "温州滨江万象城",
            "台州温岭银泰",
            "台州温岭城西大道",
            "台州经开万达",
            "台州黄岩",
            "台州黄岩吾悦",
            "台州方林汽车城",
            "玉环吾悦",
            "绍兴诸暨汽车城",
            "绍兴中国汽车城",
            "绍兴上虞万和城",
            "绍兴金柯桥大道",
            "绍兴金帝银泰城",
            "衢州吾悦",
            "衢州衢江中心店",
            "宁波余姚",
            "宁波鄞州万达",
            "宁波鄞州天街",
            "宁波下应北路",
            "宁波宁海汽车城",
            "宁波江北大道",
            "宁波舟山普陀",
            "宁波慈溪杨梅大道",
            "宁波慈溪",
            "宁波北仑汽车城",
            "丽水岩泉汽车城",
            "丽水银泰城",
            "金华永康康庄汽车城",
            "金华义乌之心",
            "金华义乌西城路",
            "金华义乌汽车城",
            "金华世贸广场",
            "金华汽车城中心店",
            "金华东阳银泰城",
            "嘉兴桐乡万象汇",
            "嘉兴平湖吾悦",
            "嘉兴南湖",
            "嘉兴南湖天地",
            "嘉兴海宁银泰城",
            "嘉兴海宁文苑路",
            "嘉兴嘉杭路",
            "嘉兴八佰伴",
            "湖州蜀山路汽车城",
            "湖州安吉国际汽车城",
            "湖州腊山汽车城",
            "湖州德清银泰城",
            "杭州西溪印象城",
            "杭州西溪路",
            "杭州西投银泰城",
            "杭州文一西路",
            "杭州梦马小镇",
            "杭州龙威大厦",
            "杭州临平",
            "杭州拱墅汽车城",
            "杭州富阳",
            "杭州城西银泰城",
            "杭州城北万象城",
            "杭州奥体印象城",
            "杭州TCAR"
        ]
    },
    "福建战区": {
        stores: [
            "厦门集美岩兴路",
            "厦门宝龙一城",
            "福州仓山万达",
            "福州仓山金林路",
            "宁德万达",
            "福州东二环泰禾",
            "莆田城厢万达",
            "龙岩新罗物流大道",
            "漳州龙文北路",
            "厦门湖里翔远路",
            "SM新生活广场",
            "厦门海沧马青路",
            "海沧SM",
            "福州榕泰",
            "青口汽车城",
            "泉州洛江",
            "中骏世界城",
            "泉州鲤城",
            "鲤城万达",
            "泉州晋江",
            "浦西万达",
            "福州万象城"
        ]
    },
    "安徽战区": {
        stores: [
            "合肥瑶海天地",
            "阜阳阜南路",
            "合肥万象城",
            "合肥瑶海国际汽车城",
            "滁州醉翁西路",
            "阜阳国际汽车城",
            "亳州药都大道",
            "合肥长江西路",
            "蚌埠银泰城",
            "合肥蜀山新粮仓KUKU PARK",
            "蚌埠国际汽车城",
            "宿州苏宁广场",
            "铜陵铜都大道",
            "黄山屯光大道",
            "马鞍山佳达汽车园",
            "合肥庐阳蒙城北路",
            "合肥包河综合中心",
            "合肥滨湖方圆荟",
            "芜湖八佰伴",
            "安庆国际汽车城",
            "六安三十铺汽车城"
        ]
    },
    "广东大区": {
        stores: [
            "深圳龙华壹方天地",
            "深圳龙岗万达",
            "深圳宝安西乡",
            "深圳福田竹子林",
            "深圳深业上城",
            "深圳Halo广场",
            "深圳南山保利",
            "深圳布吉万象汇",
            "深圳沙井京基百纳",
            "深圳宝安壹方城",
            "南山嘉进隆",
            "深圳南山科技园",
            "光明蓝鲸世界",
            "深圳仁恒梦中心",
            "龙岗坪地",
            "广州美林天地",
            "广州天汇广场igc",
            "广州南沙环宇城",
            "广州番禺龙美",
            "广州黄埔香雪",
            "广州太古汇",
            "广州天河广园路",
            "广州花都",
            "花都骏壹万邦",
            "广州白云大道",
            "凯德云尚",
            "广州番禺万博",
            "番禺祈福",
            "广州荔湾",
            "荔湾领展广场",
            "广州增城新塘汽车城",
            "增城万达",
            "东莞厚街",
            "东莞寮步",
            "东莞松山湖万象汇",
            "东莞长安万达",
            "东莞东城万达",
            "东莞塘厦东益汽车园",
            "惠州华贸天地",
            "揭阳普宁万泰汇",
            "河源源城店",
            "潮州潮安",
            "梅州梅县",
            "东莞汇一城",
            "南城莞太路",
            "惠州汝湖",
            "汕尾城区海汕公路",
            "揭阳榕城万达",
            "环市北路",
            "汕头汕汾路",
            "潮阳",
            "佛山禅城汽车城",
            "佛山顺德大良广珠路",
            "佛山顺德陈村",
            "佛山岭南天地",
            "佛山顺德欢乐海岸",
            "肇庆敏捷广场",
            "佛山海八路",
            "保利商业水城",
            "佛山南海平洲",
            "桂城金铂中心",
            "中山小榄",
            "珠海环宇城",
            "珠海香洲Center",
            "阳江金山路",
            "茂名金宁汽车城",
            "江门大融城",
            "中山彩虹大道",
            "石岐万象汇",
            "江门建设三路",
            "江海",
            "湛江霞山万达",
            "赤坎瀚龙车城"
        ]
    },
    "桂琼战区": {
        stores: [
            "南宁白沙大道",
            "南宁秀厢大道",
            "南宁南站大道",
            "南宁荟聚",
            "南宁青秀万达",
            "柳州西江路",
            "桂林灵川八里七路",
            "玉林万达",
            "海口万象城",
            "海口南海大道",
            "海口龙湖天街",
            "海口江东",
            "三亚吉阳综合"
        ]
    },
    "黑吉战区": {
        stores: [
            "哈尔滨西城红场",
            "哈尔滨机场路",
            "哈尔滨南岗零售",
            "哈尔滨先锋路",
            "大庆安萨路",
            "齐齐哈尔铁峰",
            "牡丹江万达",
            "佳木斯万达",
            "哈尔滨松北万象汇",
            "绥化北林",
            "长春净月",
            "长春高新",
            "四平铁东",
            "长春摩天活力城",
            "吉林越山路",
            "通化新胜北路",
            "延吉长白",
            "松原前郭经开",
            "长春景阳大路",
            "长春欧亚",
            "长春长沈路",
            "华润万象城",
            "长春自由大路",
            "中东新天地"
        ]
    },
    "河北战区": {
        stores: [
            "石家庄裕华汽车园",
            "石家庄长安汽车园",
            "石家庄新华汽车园",
            "石家庄长安万达",
            "石家庄裕华万达",
            "石家庄万象城",
            "保定朝阳",
            "廊坊安次汽车园",
            "霸州益昌路",
            "廊坊三河",
            "唐山万达广场",
            "唐山开平",
            "秦皇岛经开",
            "张家口容辰广场",
            "承德狮子园",
            "沧州高新",
            "沧州吾悦广场",
            "邢台华北汽车公园",
            "衡水昌明南大街",
            "邯郸现代国际汽车城",
            "美乐城"
        ]
    },
    "河南战区": {
        stores: [
            "郑州东站IP体验中心",
            "郑州经开",
            "郑州圃田威佳汽车园",
            "郑州中州大道",
            "郑州郑东万象城",
            "郑州南三环",
            "郑州航海东路",
            "二七万达",
            "郑州省汽贸",
            "郑州正弘城",
            "郑州熙地港",
            "郑州大中原国际汽车城",
            "郑州万象城",
            "郑州高新",
            "正弘汇",
            "洛阳泉舜",
            "洛阳涧西",
            "洛阳大卫天地",
            "平顶山建设路",
            "平顶山万达",
            "南阳北京大道",
            "漯河湘江西路",
            "焦作丰收路",
            "许昌建安",
            "万达",
            "开封金明大道",
            "开封龙亭万达",
            "驻马店开源大道",
            "周口太清路",
            "周口开元万达",
            "商丘梁园",
            "信阳南京大道",
            "新乡金穗大道",
            "牧野万达",
            "安阳万达",
            "豫北汽车城",
            "濮阳德众",
            "万达"
        ]
    },
    "湖北战区": {
        stores: [
            "武汉江宸天街",
            "武汉金银潭永旺",
            "武汉天地壹方南馆",
            "武汉龙阳大道",
            "武汉荟聚",
            "武汉黄金口",
            "武汉东西湖",
            "武汉黄浦科技园",
            "天地盛荟",
            "孝感孝汉大道",
            "吾悦",
            "武汉白沙洲",
            "武汉武商梦时代",
            "武汉武昌万象城",
            "武汉光谷一路",
            "武汉光谷大悦城",
            "武汉江夏永旺",
            "黄冈黄州万达",
            "黄石港万达",
            "武汉光谷世界城",
            "宜昌伍家岗",
            "宜昌发展大道",
            "襄阳深圳工业园",
            "襄阳钻石大道",
            "十堰万通工业园",
            "恩施金桂大道",
            "荆州荆沙大道",
            "荆门国际汽车城",
            "漳河万达"
        ]
    },
    "湖南战区": {
        stores: [
            "长沙岳麓区市府",
            "常德湘西北汽车城",
            "岳阳临港国际汽车城",
            "长沙中南汽车城",
            "君尚",
            "长沙望城金星北路",
            "高岭香江汽车城",
            "长沙运达汇",
            "溪悦荟",
            "衡阳杨柳汽车城",
            "衡阳蒸湘万达",
            "长沙梅溪湖",
            "长沙荟聚",
            "株洲株洲大道",
            "湘潭九华汽车大世界",
            "长沙岳麓区阳光100",
            "郴州北湖万华汽车城",
            "长沙麓谷汽车城",
            "长沙雀园路",
            "娄底湘阳街汽车城"
        ]
    },
    "江苏战区": {
        stores: [
            "苏州吴江江陵东路汽车城",
            "苏州昆山东城大道",
            "苏州太仓森茂汽车城",
            "苏州太仓万达",
            "苏州高新国际汽车城",
            "苏州吴中永旺梦乐城",
            "苏州新区永旺",
            "苏州张家港攀华国际广场",
            "张家港金茂览秀城",
            "苏州常熟汽车城",
            "常熟永旺",
            "苏州工业园区",
            "苏州园区永旺",
            "苏州相城国际汽车城",
            "大悦春风里",
            "南京东山汽车园",
            "南京景枫",
            "南京江南虹悦城",
            "南京江北虹悦城",
            "南京建邺金鹰",
            "南京溧水溧星路",
            "南京秦淮大明路",
            "南京德基广场",
            "南京浦珠北路",
            "浦口弘阳广场",
            "南京城北万象汇",
            "玄武花园城",
            "南京仙尧路",
            "仙林万达茂",
            "常州武进汽车园",
            "常州武进吾悦广场",
            "常州溧阳上河城",
            "常州万象城",
            "常州江南环球港",
            "常州钟楼吾悦广场",
            "常州飞龙吾悦",
            "常州金坛汽车城",
            "无锡先锋汽车园",
            "无锡宜兴融达汽车城",
            "无锡荟聚",
            "无锡江阴森茂汽车城",
            "无锡惠山盛岸路",
            "无锡新吴",
            "滨湖万象汇",
            "无锡万象城",
            "滨湖",
            "镇江丁卯汽车城",
            "镇江丹阳吾悦",
            "南通崇川瑞力产业园",
            "南通如皋万达广场",
            "南通开发区",
            "南通中南城",
            "扬州国际汽车城",
            "京华城",
            "泰州国际汽车城",
            "靖江印象城",
            "宿迁国际汽车城",
            "徐州苏宁广场",
            "盐城盐都万达",
            "盐城东台德润",
            "沭阳国际汽车城",
            "淮安旺旺路",
            "万象城",
            "连云港振兴汽车城",
            "港万达",
            "徐州东站汽车园",
            "杉杉奥莱"
        ]
    },
    "江西战区": {
        stores: [
            "南昌万象城",
            "南昌王府井",
            "南昌高新大道",
            "南昌恒望汽车城",
            "九江招商花园城",
            "九江九瑞大道",
            "赣州章贡",
            "抚州临川",
            "南昌碟子湖大道",
            "红谷滩万达广场",
            "上饶月亮湾",
            "景德镇国大汽车城"
        ]
    },
    "晋蒙战区": {
        stores: [
            "太原晋祠路",
            "太原空港汽车城",
            "太原太榆路",
            "太原新汇众",
            "太原吾悦广场",
            "晋中汇通北路",
            "通辽创业大道",
            "呼伦贝尔大鹏汽车园",
            "赤峰火花北路",
            "大同庞大汽车园",
            "长治关村汽贸园",
            "运城机场路",
            "临汾尧都秦蜀路",
            "晋城万达",
            "忻州开发区汽车城",
            "孝义府前街",
            "呼和浩特海西路",
            "呼和浩特东利丰",
            "呼和浩特万象城",
            "包头稀土路",
            "鄂尔多斯铜川",
            "鄂尔多斯康巴什"
        ]
    },
    "辽宁战区": {
        stores: [
            "沈阳北二路",
            "沈阳东陵路",
            "沈阳万象城",
            "锦州太和",
            "沈阳浑南西路",
            "沈阳长白万象汇",
            "沈阳龙湖浑南天街",
            "沈阳三台子万象汇",
            "葫芦岛龙港",
            "大连虹城路",
            "辽阳繁荣路",
            "大连柏威年",
            "大连华北路",
            "华南万象汇",
            "鞍山建设大道",
            "万象汇"
        ]
    },
    "上海战区": {
        stores: [
            "上海长泰",
            "上海世纪汇",
            "上海张杨路",
            "上海宝山龙湖",
            "上海合生汇",
            "上海嘉亭荟",
            "上海凯德虹口龙之梦",
            "上海南翔印象城",
            "上海普陀红柳路",
            "上海中海环宇城Max",
            "上海中信泰富万达",
            "上海静安大融城",
            "北外滩来福士",
            "上海前滩LPLAZA",
            "上海长宁来福士",
            "上海奉贤天街",
            "上海南丰城",
            "上海虹桥天地",
            "上海蟠龙天地",
            "上海手拉手",
            "上海熊猫广场",
            "上海复地活力城",
            "周浦万达"
        ]
    },
    "陕西战区": {
        stores: [
            "西安万象城",
            "西安经开",
            "西安王府井熙地港店",
            "西安西咸万象城",
            "西安西三环",
            "西安高新",
            "高新万达",
            "渭南高新",
            "延安碾庄汽车城",
            "延安吾悦广场",
            "宝鸡会展",
            "宝鸡银泰城",
            "咸阳秦都",
            "榆林博源路",
            "万达",
            "汉中天汉大道",
            "吾悦",
            "西安未央",
            "西安长安",
            "西安乐荟中心",
            "西安灞桥",
            "西安量子晨",
            "西安荟聚",
            "西安碑林区南门王府井",
            "西安浐灞",
            "长乐天街"
        ]
    },
    "山东大区": {
        stores: [
            "滨州赛博汽车园",
            "东营北二路",
            "菏泽定陶汽车城",
            "济南CBD",
            "济南华山环宇城",
            "济南经十西路",
            "济南经四路万达",
            "济南领秀城贵和",
            "济宁润华汽车园",
            "济宁太白路万达广场",
            "临沂上海路万达",
            "临沂沂河路",
            "青岛黑龙江中路",
            "青岛金狮广场",
            "青岛李沧万达",
            "青岛万象城",
            "青岛西海岸吾悦广场",
            "日照奎山汽车城",
            "潍坊万达",
            "潍坊潍州路汽车城",
            "威海威高广场",
            "淄博经开",
            "菏泽黄河东路",
            "泰安吾悦广场",
            "德州德百汽车城",
            "济南凤凰路",
            "济宁美恒汽车城",
            "临沂河东汽车城",
            "青岛银川西路",
            "泰安岱岳区泮河大街",
            "潍坊寿光汽车园",
            "烟台北京南路",
            "枣庄光明大道汽车城",
            "淄博金晶大道",
            "烟台机场路",
            "临沂义堂",
            "聊城五洲汽车园",
            "青岛胶州龙湖天街",
            "济南印象城",
            "滨州北海大道",
            "威海金蚂蚁",
            "青岛重庆南路",
            "青岛凯德Mall新都心",
            "青岛福州北路",
            "日照万象汇",
            "临沂万象汇"
        ]
    },
    "四川大区": {
        stores: [
            "成都羊西",
            "成都金牛凯德",
            "成都银泰城",
            "成都西航港",
            "成都龙湖蜀新天街",
            "成都天府和悦广场",
            "成都麓山大道",
            "成都合生汇",
            "成都五龙山",
            "成都锦宸天街",
            "绵阳经开机场路",
            "德阳泰山南路",
            "宜宾万达",
            "达州汉兴大道",
            "泸州川南汽车园",
            "自贡南环路",
            "眉山汽车产业园",
            "乐山世豪广场",
            "乐山长青路",
            "南充王府井",
            "南充江东大道",
            "绵阳涪城万达",
            "绵阳永兴",
            "西昌琦洋汽车城",
            "成都深业车城",
            "成都高新机场路",
            "成都万象城",
            "成都锦江大道",
            "成都世茂广场",
            "成都大悦城",
            "成都太古里",
            "拉萨文成大道",
            "成都龙湖滨江天街",
            "成都龙潭"
        ]
    },
    "天津战区": {
        stores: [
            "天津滨海第五大街",
            "天津天河城",
            "天津武清万达",
            "天津西青大悦汇",
            "天津中北镇",
            "天津滨海万达",
            "天津恒隆广场",
            "北辰浩物",
            "天津万象城",
            "龙湖天街",
            "天津大寺汽车园",
            "解放南路",
            "天津空港",
            "蓟州中昌南大道"
        ]
    },
    "新青甘宁战区": {
        stores: [
            "兰州安宁",
            "兰州中心",
            "银川德胜",
            "银川阅彩城",
            "银川悠阅城",
            "西宁金岛汽车城",
            "兰州万象城",
            "兰州万达茂",
            "银川金凤",
            "庆阳陇东汽车城",
            "乌鲁木齐米东汽车城",
            "乌鲁木齐会展吾悦广场",
            "乌鲁木齐友好汽车城",
            "乌鲁木齐经开综合中心",
            "库尔勒神舟国际",
            "伊犁巴彦岱汽车城",
            "阿克苏大欣汽车城（南疆）",
            "喀什新怡发"
        ]
    },
    "云贵战区": {
        stores: [
            "昆明浩宏",
            "昆明北京路",
            "昆明万象城",
            "大理泰业",
            "昆明公园1903",
            "南亚风情第壹城",
            "昆明园博",
            "荟聚",
            "曲靖万达",
            "三江大道",
            "贵阳孟关",
            "贵阳万象城",
            "贵阳云岩",
            "铜仁万山",
            "贵阳万象汇",
            "遵义董公寺",
            "忠庄"
        ]
    },
    "重庆战区": {
        stores: [
            "重庆金菱车世界",
            "重庆经纬大道",
            "重庆万象城",
            "重庆八公里",
            "重庆高新天街",
            "重庆协信星光",
            "重庆永川",
            "江津爱琴海",
            "重庆光环购物公园",
            "重庆汽博",
            "重庆回兴",
            "重庆龙湖公园天街",
            "重庆万州沙龙",
            "重庆红锦大道",
            "新光里"
        ]
    }
};

// ============== 中国节假日数据 (2025-2026) ==============
// 包含法定节假日和调休安排
const chineseHolidays = {
    2025: {
        '01-01': '元旦',
        '01-28': '春节',
        '01-29': '春节',
        '01-30': '春节',
        '01-31': '春节',
        '02-01': '春节',
        '02-02': '春节',
        '02-03': '春节',
        '02-04': '春节',
        '04-05': '清明节',
        '04-06': '清明节',
        '04-07': '清明节',
        '05-01': '劳动节',
        '05-02': '劳动节',
        '05-03': '劳动节',
        '05-04': '劳动节',
        '05-05': '劳动节',
        '05-31': '端午节',
        '06-01': '端午节',
        '06-02': '端午节',
        '10-01': '国庆节',
        '10-02': '国庆节',
        '10-03': '国庆节',
        '10-04': '国庆节',
        '10-05': '国庆节',
        '10-06': '国庆节',
        '10-07': '国庆节',
        '10-08': '国庆节'
    },
    2026: {
        // 元旦：1月1日-3日放假，1月4日（周日）调休上班
        '01-01': '元旦',
        '01-02': '元旦',
        '01-03': '元旦',
        // 春节：2月15日-23日放假（9天），2月14日、2月28日调休上班
        '02-15': '春节',
        '02-16': '春节',
        '02-17': '春节',
        '02-18': '春节',
        '02-19': '春节',
        '02-20': '春节',
        '02-21': '春节',
        '02-22': '春节',
        '02-23': '春节',
        // 清明节：4月4日-6日放假
        '04-04': '清明节',
        '04-05': '清明节',
        '04-06': '清明节',
        // 劳动节：5月1日-5日放假，5月9日调休上班
        '05-01': '劳动节',
        '05-02': '劳动节',
        '05-03': '劳动节',
        '05-04': '劳动节',
        '05-05': '劳动节',
        // 端午节：6月19日-21日放假
        '06-19': '端午节',
        '06-20': '端午节',
        '06-21': '端午节',
        // 中秋节：9月25日-27日放假
        '09-25': '中秋节',
        '09-26': '中秋节',
        '09-27': '中秋节',
        // 国庆节：10月1日-7日放假，9月20日、10月10日调休上班
        '10-01': '国庆节',
        '10-02': '国庆节',
        '10-03': '国庆节',
        '10-04': '国庆节',
        '10-05': '国庆节',
        '10-06': '国庆节',
        '10-07': '国庆节'
    }
};


// ============== 工具函数 ==============
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getWeekday(date) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[date.getDay()];
}

function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
}

function getHoliday(date) {
    const year = date.getFullYear();
    const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return chineseHolidays[year]?.[monthDay] || null;
}

function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

// ============== 初始化 ==============
document.addEventListener('DOMContentLoaded', function() {
    initializeYearSelector();
    initializeUpload();
    initializeMonthSelector();
    initializeSpecialEvents();
    initializeGenerateButton();
    initializeExportButton();
    initializeTargetInput();
    initializeVehicleManagement();  // 新增：初始化车型管理
    checkWorkflowState();  // 新增：初始化按钮状态
});

function initializeYearSelector() {
    const yearSelect = document.getElementById('yearSelect');
    const currentYear = new Date().getFullYear();

    for (let year = currentYear; year <= currentYear + 2; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = `${year}年`;
        yearSelect.appendChild(option);
    }

    yearSelect.value = currentYear;
}

// ============== 文件上传功能 ==============
function initializeUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFileUpload(file);
    });
}

function handleFileUpload(file) {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
        alert('请上传Excel文件（.xlsx 或 .xls）');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            if (jsonData.length === 0) {
                alert('Excel文件为空，请检查数据');
                return;
            }

            // 验证数据格式
            const requiredColumns = ['日期', '车型', '实际量'];
            const hasRequiredColumns = requiredColumns.every(col =>
                jsonData.some(row => col in row)
            );

            if (!hasRequiredColumns) {
                alert('Excel格式不正确，请确保包含：日期、车型、实际量列');
                return;
            }

            // 过滤掉无效行（车型为空的行）
            const cleanedData = jsonData.filter(row => {
                return row['车型'] !== null &&
                       row['车型'] !== undefined &&
                       String(row['车型']).trim() !== '';
            });

            if (cleanedData.length === 0) {
                alert('Excel中没有有效数据，请检查文件内容');
                return;
            }

            state.uploadedData = cleanedData;
            displayFileInfo(file.name, cleanedData.length);
            aggregateData();

            // 更新workflow状态
            state.workflow.dataUploaded = true;

            // 初始化车型配置
            initializeVehicleConfig();

            // 不再调用checkCanGenerate，由workflow统一管理
            checkWorkflowState();

            console.log('步骤2完成：数据已上传，已提取车型列表');

        } catch (error) {
            alert('文件解析失败：' + error.message);
        }
    };

    reader.readAsArrayBuffer(file);
}

function displayFileInfo(fileName, rowCount) {
    const fileInfo = document.getElementById('fileInfo');
    fileInfo.innerHTML = `
        <svg style="width:24px;height:24px;color:#52c41a" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <div>
            <strong>${fileName}</strong>
            <span style="color: #8c8c8c; margin-left: 12px;">共 ${rowCount} 条数据</span>
        </div>
    `;
    fileInfo.classList.remove('hidden');
}

// ============== 数据聚合 ==============
function aggregateData() {
    if (!state.uploadedData) return;

    const aggregated = {};

    state.uploadedData.forEach((row, idx) => {
        // 解析日期
        let dateStr;
        if (row['日期'] instanceof Date) {
            dateStr = formatDate(row['日期']);
        } else if (typeof row['日期'] === 'number') {
            // Excel日期序列号
            const excelDate = XLSX.SSF.parse_date_code(row['日期']);
            dateStr = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
        } else {
            dateStr = String(row['日期']).split(' ')[0];
        }

        const vehicle = String(row['车型']).trim();
        const amount = Number(row['实际量']) || 0;

        // 🔍 调试：输出前5行原始数据
        if (idx < 5) {
            console.log(`🔍 Row ${idx}:`, {
                date: dateStr,
                vehicle: vehicle,
                rawAmount: row['实际量'],
                parsedAmount: amount,
                allKeys: Object.keys(row)
            });
        }

        const key = `${dateStr}_${vehicle}`;
        if (!aggregated[key]) {
            aggregated[key] = {
                date: dateStr,
                vehicle: vehicle,
                amount: 0
            };
        }
        aggregated[key].amount += amount;
    });

    state.aggregatedData = Object.values(aggregated);
    console.log('数据聚合完成:', state.aggregatedData.length, '条记录');
    console.log('🔍 前3条聚合数据:', state.aggregatedData.slice(0, 3));
}

// ============== 工作流状态管理（新增）==============
/**
 * 统一的按钮状态控制函数
 * 根据workflow状态启用/禁用各步骤的操作
 */
function checkWorkflowState() {
    const { workflow } = state;

    // 步骤2：上传数据区域
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        if (!workflow.regionSelected) {
            uploadArea.style.opacity = '0.5';
            uploadArea.style.pointerEvents = 'none';
            uploadArea.title = '请先选择区域';
        } else {
            uploadArea.style.opacity = '1';
            uploadArea.style.pointerEvents = 'auto';
            uploadArea.title = '';
        }
    }

    // 步骤2.5：添加新车型按钮
    const addNewVehicleBtn = document.getElementById('addNewVehicleBtn');
    if (addNewVehicleBtn) {
        addNewVehicleBtn.disabled = !workflow.dataUploaded;
        if (!workflow.dataUploaded) {
            addNewVehicleBtn.title = '请先上传数据';
        } else {
            addNewVehicleBtn.title = '';
        }
    }

    // 步骤2.5：确认车型配置按钮
    const confirmVehicleConfigBtn = document.getElementById('confirmVehicleConfigBtn');
    if (confirmVehicleConfigBtn) {
        const canConfirm = workflow.dataUploaded && state.enabledVehicleCount > 0;
        confirmVehicleConfigBtn.disabled = !canConfirm;

        const feedback = document.getElementById('vehicleConfigFeedback');
        if (feedback) {
            if (!workflow.dataUploaded) {
                feedback.textContent = '请先上传数据';
                feedback.style.color = '#999';
            } else if (state.enabledVehicleCount === 0) {
                feedback.textContent = '⚠️ 请至少启用一个车型';
                feedback.style.color = '#F57C00';
            } else {
                feedback.textContent = `已启用 ${state.enabledVehicleCount} 个车型`;
                feedback.style.color = '#2E7D32';
            }
        }
    }

    // 步骤3：月份选择
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');
    [yearSelect, monthSelect].forEach(el => {
        if (el) {
            el.disabled = !workflow.vehiclesConfigured;
            if (!workflow.vehiclesConfigured) {
                el.title = '请先确认车型配置';
            } else {
                el.title = '';
            }
        }
    });

    // 步骤5：生成按钮
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        const canGenerate = workflow.vehiclesConfigured && workflow.monthSelected;
        generateBtn.disabled = !canGenerate;

        if (!workflow.vehiclesConfigured) {
            generateBtn.title = '请先确认车型配置';
        } else if (!workflow.monthSelected) {
            generateBtn.title = '请先选择预测月份';
        } else {
            generateBtn.title = '';
        }
    }

    // 步骤6：导出按钮
    const exportBtn = document.getElementById('exportBtn');
    const exportHorizontalBtn = document.getElementById('exportHorizontalBtn');
    [exportBtn, exportHorizontalBtn].forEach(btn => {
        if (btn) {
            btn.disabled = !workflow.ratiosGenerated;
            if (!workflow.ratiosGenerated) {
                btn.title = '请先生成分配比例';
            } else {
                btn.title = '';
            }
        }
    });
}

// ============== 车型管理模块（新增）==============

/**
 * 从历史数据初始化车型配置
 */
function initializeVehicleConfig() {
    if (!state.aggregatedData) return;

    // 提取所有唯一车型
    const vehicleSet = new Set();
    state.aggregatedData.forEach(row => {
        vehicleSet.add(row.vehicle);
    });

    const vehicles = Array.from(vehicleSet).sort();

    // 初始化车型配置（所有历史车型默认启用）
    state.vehicleConfig = {};
    vehicles.forEach(vehicleCode => {
        state.vehicleConfig[vehicleCode] = {
            code: vehicleCode,
            name: vehicleCode, // 默认名称同代码
            type: 'historical',  // 历史车型
            enabled: true,
            // 去库存配置（如果类型为clearStock时使用）
            clearStock: {
                startDate: null,
                endDate: null
            },
            // 新增车型配置（如果类型为new时使用）
            newVehicle: {
                template: 'average',
                launchDate: null
            }
        };
    });

    state.enabledVehicleCount = vehicles.length;

    console.log('车型配置初始化完成:', vehicles.length, '个车型');

    // 显示车型管理区域
    const vehicleManagementSection = document.getElementById('vehicleManagementSection');
    if (vehicleManagementSection) {
        vehicleManagementSection.classList.remove('hidden');
        vehicleManagementSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // 渲染车型列表
    renderVehicleList();

    // 更新按钮状态
    checkWorkflowState();
}

/**
 * 渲染车型列表
 */
function renderVehicleList() {
    const tbody = document.getElementById('vehicleListBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const vehicles = Object.values(state.vehicleConfig).sort((a, b) => {
        // 排序：历史 > 去库存 > 新增
        const typeOrder = { historical: 1, clearStock: 2, new: 3 };
        if (typeOrder[a.type] !== typeOrder[b.type]) {
            return typeOrder[a.type] - typeOrder[b.type];
        }
        return a.code.localeCompare(b.code);
    });

    vehicles.forEach(vehicle => {
        const tr = document.createElement('tr');
        if (!vehicle.enabled) {
            tr.classList.add('disabled');
        } else if (vehicle.type === 'clearStock') {
            tr.classList.add('clear-stock');
        } else if (vehicle.type === 'new') {
            tr.classList.add('new-vehicle');
        }

        // 车型代码
        const tdCode = document.createElement('td');
        tdCode.textContent = vehicle.code;
        tr.appendChild(tdCode);

        // 车型名称
        const tdName = document.createElement('td');
        tdName.textContent = vehicle.name;
        tr.appendChild(tdName);

        // 类型
        const tdType = document.createElement('td');
        const typeBadge = document.createElement('span');
        typeBadge.className = `vehicle-type-badge ${vehicle.type}`;
        if (vehicle.type === 'historical') {
            typeBadge.textContent = '历史车型';
        } else if (vehicle.type === 'clearStock') {
            typeBadge.textContent = '📉 去库存';
        } else if (vehicle.type === 'new') {
            typeBadge.textContent = '🆕 新增';
        }
        tdType.appendChild(typeBadge);
        tr.appendChild(tdType);

        // 配置
        const tdConfig = document.createElement('td');
        if (vehicle.type === 'clearStock') {
            tdConfig.textContent = `${vehicle.clearStock.startDate} → ${vehicle.clearStock.endDate}`;
            tdConfig.style.fontSize = '12px';
            tdConfig.style.color = '#F57C00';
        } else if (vehicle.type === 'new') {
            const templateName = vehicleRhythmTemplates[vehicle.newVehicle.template]?.name || vehicle.newVehicle.template;
            tdConfig.textContent = `${templateName} | ${vehicle.newVehicle.launchDate}`;
            tdConfig.style.fontSize = '12px';
            tdConfig.style.color = '#1976D2';
        } else {
            tdConfig.textContent = '-';
            tdConfig.style.color = '#999';
        }
        tr.appendChild(tdConfig);

        // 操作
        const tdActions = document.createElement('td');
        tdActions.style.display = 'flex';
        tdActions.style.gap = '8px';

        // 启用/停用按钮
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'btn btn-secondary';
        toggleBtn.textContent = vehicle.enabled ? '停用' : '启用';
        toggleBtn.style.fontSize = '12px';
        toggleBtn.style.padding = '4px 12px';
        toggleBtn.onclick = () => toggleVehicleEnabled(vehicle.code);
        tdActions.appendChild(toggleBtn);

        // 历史车型显示"标记去库存"按钮
        if (vehicle.type === 'historical' && vehicle.enabled) {
            const clearStockBtn = document.createElement('button');
            clearStockBtn.className = 'btn btn-secondary';
            clearStockBtn.textContent = '标记去库存';
            clearStockBtn.style.fontSize = '12px';
            clearStockBtn.style.padding = '4px 12px';
            clearStockBtn.onclick = () => markVehicleAsClearStock(vehicle.code);
            tdActions.appendChild(clearStockBtn);
        }

        // 去库存车型显示"取消标记"按钮
        if (vehicle.type === 'clearStock' && vehicle.enabled) {
            const unmarkBtn = document.createElement('button');
            unmarkBtn.className = 'btn btn-secondary';
            unmarkBtn.textContent = '取消标记';
            unmarkBtn.style.fontSize = '12px';
            unmarkBtn.style.padding = '4px 12px';
            unmarkBtn.onclick = () => unmarkClearStock(vehicle.code);
            tdActions.appendChild(unmarkBtn);
        }

        tr.appendChild(tdActions);
        tbody.appendChild(tr);
    });
}

/**
 * 切换车型启用/停用状态
 */
function toggleVehicleEnabled(vehicleCode) {
    const vehicle = state.vehicleConfig[vehicleCode];
    if (!vehicle) return;

    vehicle.enabled = !vehicle.enabled;

    // 更新计数
    state.enabledVehicleCount = Object.values(state.vehicleConfig).filter(v => v.enabled).length;

    // 重新渲染
    renderVehicleList();
    checkWorkflowState();
}

/**
 * 标记车型为去库存
 */
function markVehicleAsClearStock(vehicleCode) {
    const vehicle = state.vehicleConfig[vehicleCode];
    if (!vehicle || vehicle.type !== 'historical') return;

    // 显示模态框
    const modalHtml = `
        <div class="modal-overlay" id="clearStockModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>标记去库存</h3>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 16px; color: #666;">
                        车型：<strong>${vehicle.code} ${vehicle.name}</strong>
                    </p>
                    <div class="modal-form-group">
                        <label>清库开始日期</label>
                        <input type="date" id="clearStartDate" required>
                    </div>
                    <div class="modal-form-group">
                        <label>清零日期</label>
                        <input type="date" id="clearEndDate" required>
                    </div>
                    <p style="font-size: 13px; color: #999; margin-top: 12px;">
                        💡 在此期间，商机量将线性衰减到0
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('clearStockModal').remove()">取消</button>
                    <button class="btn btn-primary" onclick="confirmClearStock('${vehicleCode}')">确认</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

/**
 * 确认去库存设置
 */
function confirmClearStock(vehicleCode) {
    const startDate = document.getElementById('clearStartDate').value;
    const endDate = document.getElementById('clearEndDate').value;

    if (!startDate || !endDate) {
        alert('请填写完整日期');
        return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
        alert('清零日期必须晚于开始日期');
        return;
    }

    const vehicle = state.vehicleConfig[vehicleCode];
    vehicle.type = 'clearStock';
    vehicle.clearStock.startDate = startDate;
    vehicle.clearStock.endDate = endDate;

    // 关闭模态框
    document.getElementById('clearStockModal').remove();

    // 重新渲染
    renderVehicleList();
}

/**
 * 取消去库存标记
 */
function unmarkClearStock(vehicleCode) {
    const vehicle = state.vehicleConfig[vehicleCode];
    if (!vehicle) return;

    vehicle.type = 'historical';
    vehicle.clearStock.startDate = null;
    vehicle.clearStock.endDate = null;

    renderVehicleList();
}

/**
 * 添加新车型
 */
function addNewVehicle() {
    // 显示模态框
    const modalHtml = `
        <div class="modal-overlay" id="addVehicleModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>添加新车型</h3>
                </div>
                <div class="modal-body">
                    <div class="modal-form-group">
                        <label>车型代码（必填）</label>
                        <input type="text" id="newVehicleCode" placeholder="如：W03" required>
                    </div>
                    <div class="modal-form-group">
                        <label>车型名称（可选）</label>
                        <input type="text" id="newVehicleName" placeholder="如：理想L6">
                    </div>
                    <div class="modal-form-group">
                        <label>节奏模板</label>
                        <div class="modal-template-options">
                            <label class="modal-template-option">
                                <input type="radio" name="vehicleTemplate" value="average" checked>
                                <div class="modal-template-label">
                                    <strong>📊 平均模板（推荐）</strong>
                                    <span>适用于大部分新车型</span>
                                </div>
                            </label>
                            <label class="modal-template-option">
                                <input type="radio" name="vehicleTemplate" value="i8">
                                <div class="modal-template-label">
                                    <strong>🔥 i8模板（热度持久）</strong>
                                    <span>适用于重磅主力车型</span>
                                </div>
                            </label>
                            <label class="modal-template-option">
                                <input type="radio" name="vehicleTemplate" value="mega">
                                <div class="modal-template-label">
                                    <strong>⚡ MEGA模板（快速回落）</strong>
                                    <span>适用于小众/改款车型</span>
                                </div>
                            </label>
                        </div>
                    </div>
                    <div class="modal-form-group">
                        <label>发布日期（必填）</label>
                        <input type="date" id="newVehicleLaunchDate" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('addVehicleModal').remove()">取消</button>
                    <button class="btn btn-primary" onclick="confirmAddVehicle()">确认添加</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

/**
 * 确认添加新车型
 */
function confirmAddVehicle() {
    const code = document.getElementById('newVehicleCode').value.trim();
    const name = document.getElementById('newVehicleName').value.trim() || code;
    const template = document.querySelector('input[name="vehicleTemplate"]:checked').value;
    const launchDate = document.getElementById('newVehicleLaunchDate').value;

    if (!code) {
        alert('请输入车型代码');
        return;
    }

    if (state.vehicleConfig[code]) {
        alert('车型代码已存在');
        return;
    }

    if (!launchDate) {
        alert('请选择发布日期');
        return;
    }

    // 校验发布日期是否在预测月份之后
    if (state.targetYear && state.targetMonth) {
        const forecastMonthEnd = new Date(state.targetYear, state.targetMonth, 0); // 预测月最后一天
        const launch = new Date(launchDate);
        if (launch > forecastMonthEnd) {
            alert(`警告：发布日期（${launchDate}）晚于预测月份（${state.targetYear}年${state.targetMonth}月），生成的分布将为均匀分配，可能不符合预期。\n\n如需继续请重新选择发布日期，或确认该车型在预测月份内尚未发布。`);
            return;
        }
    }

    // 添加到配置
    state.vehicleConfig[code] = {
        code,
        name,
        type: 'new',
        enabled: true,
        clearStock: {
            startDate: null,
            endDate: null
        },
        newVehicle: {
            template,
            launchDate
        }
    };

    state.enabledVehicleCount++;

    // 关闭模态框
    document.getElementById('addVehicleModal').remove();

    // 重新渲染
    renderVehicleList();
    checkWorkflowState();
}

/**
 * 确认车型配置
 */
function confirmVehicleConfig() {
    if (state.enabledVehicleCount === 0) {
        alert('请至少启用一个车型');
        return;
    }

    state.workflow.vehiclesConfigured = true;

    // 隐藏车型管理区域
    const vehicleManagementSection = document.getElementById('vehicleManagementSection');
    if (vehicleManagementSection) {
        vehicleManagementSection.classList.add('hidden');
    }

    // 显示成功提示
    const feedback = document.getElementById('vehicleConfigFeedback');
    if (feedback) {
        feedback.textContent = `✓ 车型配置已确认（${state.enabledVehicleCount}个车型）`;
        feedback.style.color = '#2E7D32';
        feedback.style.fontWeight = '600';
    }

    // 解锁步骤3
    checkWorkflowState();

    console.log('车型配置已确认:', state.vehicleConfig);
}

// ============== 月份选择 ==============
function initializeMonthSelector() {
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');
    const ignoreHistoryCheckbox = document.getElementById('ignoreHistoryCheckbox');
    const weekdayMultiplier = document.getElementById('weekdayMultiplier');
    const weekendMultiplier = document.getElementById('weekendMultiplier');
    const holidayMultiplier = document.getElementById('holidayMultiplier');

    // 默认选择下个月
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    monthSelect.value = nextMonth.getMonth() + 1;

    yearSelect.addEventListener('change', updateTargetMonth);
    monthSelect.addEventListener('change', updateTargetMonth);
    ignoreHistoryCheckbox.addEventListener('change', function() {
        state.ignoreHistoryData = this.checked;
        autoRefreshResults();
    });

    // 权重倍数调整事件监听
    weekdayMultiplier.addEventListener('input', function() {
        state.weightMultipliers.weekday = parseFloat(this.value) || 1.0;
        autoRefreshResults();
    });
    weekendMultiplier.addEventListener('input', function() {
        state.weightMultipliers.weekend = parseFloat(this.value) || 1.0;
        autoRefreshResults();
    });
    holidayMultiplier.addEventListener('input', function() {
        state.weightMultipliers.holiday = parseFloat(this.value) || 1.0;
        autoRefreshResults();
    });

    // 初始化时调用一次，显示默认月份的日历
    updateTargetMonth();
}

function updateTargetMonth() {
    state.targetYear = Number(document.getElementById('yearSelect').value);
    state.targetMonth = Number(document.getElementById('monthSelect').value);

    // 更新workflow状态
    state.workflow.monthSelected = true;

    updateCalendarView();

    // 不再调用checkCanGenerate，由workflow统一管理
    checkWorkflowState();

    console.log('步骤3完成：月份已选择', state.targetYear, state.targetMonth);
}

function updateCalendarView() {
    const calendarView = document.getElementById('calendarView');
    const specialEventsForm = document.getElementById('specialEventsForm');

    const daysInMonth = getDaysInMonth(state.targetYear, state.targetMonth);
    let holidayCount = 0;
    let weekendCount = 0;
    let workdayCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(state.targetYear, state.targetMonth - 1, day);
        const holiday = getHoliday(date);
        const weekend = isWeekend(date);

        if (holiday) {
            holidayCount++;
        } else if (weekend) {
            weekendCount++;
        } else {
            workdayCount++;
        }
    }

    calendarView.innerHTML = `
        <h3>📅 ${state.targetYear}年${state.targetMonth}月</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="label">总天数</div>
                <div class="value">${daysInMonth}</div>
            </div>
            <div class="summary-item">
                <div class="label">工作日</div>
                <div class="value">${workdayCount}</div>
            </div>
            <div class="summary-item">
                <div class="label">周末</div>
                <div class="value">${weekendCount}</div>
            </div>
            <div class="summary-item">
                <div class="label">法定节假日</div>
                <div class="value">${holidayCount}</div>
            </div>
        </div>
    `;
    calendarView.className = '';
    specialEventsForm.classList.remove('hidden');

    // 更新日期选择器的范围
    const eventDate = document.getElementById('eventDate');
    eventDate.min = `${state.targetYear}-${String(state.targetMonth).padStart(2, '0')}-01`;
    eventDate.max = `${state.targetYear}-${String(state.targetMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
}

// ============== 特殊节点管理 ==============
function initializeSpecialEvents() {
    const addEventBtn = document.getElementById('addEventBtn');
    addEventBtn.addEventListener('click', addSpecialEvent);
}

function addSpecialEvent() {
    const eventDate = document.getElementById('eventDate').value;
    const eventType = document.getElementById('eventType').value;
    const eventName = document.getElementById('eventName').value;

    if (!eventDate || !eventName) {
        alert('请填写完整的节点信息');
        return;
    }

    const event = {
        date: eventDate,
        type: eventType,
        name: eventName
    };

    state.specialEvents.push(event);
    renderEventsList();
    autoRefreshResults();

    // 清空输入
    document.getElementById('eventDate').value = '';
    document.getElementById('eventName').value = '';
}

function renderEventsList() {
    const eventsList = document.getElementById('eventsList');

    if (state.specialEvents.length === 0) {
        eventsList.innerHTML = '<p style="color: #8c8c8c; text-align: center;">暂无特殊节点</p>';
        return;
    }

    eventsList.innerHTML = state.specialEvents.map((event, index) => `
        <div class="event-item ${event.type}">
            <div>
                <strong>${event.date}</strong> - ${event.name}
                <span class="tag tag-${event.type}">${getEventTypeLabel(event.type)}</span>
            </div>
            <button class="event-remove" onclick="removeSpecialEvent(${index})">×</button>
        </div>
    `).join('');
}

function removeSpecialEvent(index) {
    state.specialEvents.splice(index, 1);
    renderEventsList();
    autoRefreshResults();
}

function getEventTypeLabel(type) {
    const labels = {
        adjustment: '调休',
        promotion: '促销',
        launch: '新车',
        other: '其他'
    };
    return labels[type] || type;
}

// ============== 车型管理初始化 ==============
function initializeVehicleManagement() {
    // 添加新车型按钮
    const addNewVehicleBtn = document.getElementById('addNewVehicleBtn');
    if (addNewVehicleBtn) {
        addNewVehicleBtn.addEventListener('click', addNewVehicle);
    }

    // 确认车型配置按钮
    const confirmVehicleConfigBtn = document.getElementById('confirmVehicleConfigBtn');
    if (confirmVehicleConfigBtn) {
        confirmVehicleConfigBtn.addEventListener('click', confirmVehicleConfig);
    }
}

// ============== 生成按钮 ==============
function initializeGenerateButton() {
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.addEventListener('click', generateDailyRatios);
}

function checkCanGenerate() {
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.disabled = !state.uploadedData || !state.targetYear || !state.targetMonth;
}

// ============== 核心算法：生成每日比例 ==============
function generateDailyRatios() {
    const loading = document.getElementById('loading');
    loading.classList.remove('hidden');

    // 模拟计算延迟
    setTimeout(() => {
        try {
            const results = {};

            // 获取所有启用的车型
            const enabledVehicles = Object.values(state.vehicleConfig).filter(v => v.enabled);

            if (enabledVehicles.length === 0) {
                throw new Error('没有启用的车型');
            }

            console.log('开始生成比例，启用车型数:', enabledVehicles.length);

            // ========== 第一步：处理历史车型 ==========
            const historicalVehicles = enabledVehicles.filter(v => v.type === 'historical');
            const historicalWithSufficientData = [];
            const historicalWithInsufficientData = [];

            historicalVehicles.forEach(vehicle => {
                const samePeriodDays = countSamePeriodDays(vehicle.code);
                if (samePeriodDays >= 15) {
                    historicalWithSufficientData.push(vehicle);
                    results[vehicle.code] = calculateVehicleDailyRatios(vehicle.code);
                    console.log(`✓ 历史车型 "${vehicle.code}" 使用历史算法`);
                } else {
                    historicalWithInsufficientData.push(vehicle);
                    console.log(`⚠️ 历史车型 "${vehicle.code}" 数据不足 (${samePeriodDays}天)`);
                }
            });

            // 如果有数据不足的历史车型，使用充足车型的平均比例
            if (historicalWithInsufficientData.length > 0 && historicalWithSufficientData.length > 0) {
                const averageRatios = calculateAverageRatios(results, historicalWithSufficientData.map(v => v.code));
                historicalWithInsufficientData.forEach(vehicle => {
                    results[vehicle.code] = averageRatios.map(d => ({...d}));
                    console.log(`✓ 历史车型 "${vehicle.code}" 使用平均比例`);
                });
            } else if (historicalWithInsufficientData.length > 0 && historicalWithSufficientData.length === 0) {
                // 所有历史车型数据都不足，按原逻辑计算
                historicalWithInsufficientData.forEach(vehicle => {
                    results[vehicle.code] = calculateVehicleDailyRatios(vehicle.code);
                });
            }

            // ========== 第二步：处理新增车型（应用模板）==========
            const newVehicles = enabledVehicles.filter(v => v.type === 'new');
            newVehicles.forEach(vehicle => {
                const template = vehicle.newVehicle.template;
                const launchDate = vehicle.newVehicle.launchDate;

                // 应用模板生成每日权重
                const dailyWeights = applyVehicleTemplate(
                    template,
                    launchDate,
                    state.targetYear,
                    state.targetMonth
                );

                if (!dailyWeights) {
                    console.error(`新增车型 "${vehicle.code}" 模板应用失败`);
                    results[vehicle.code] = generateDefaultRatios();
                    return;
                }

                // 将权重转换为比例格式
                results[vehicle.code] = convertWeightsToRatios(dailyWeights, vehicle.code);
                console.log(`✓ 新增车型 "${vehicle.code}" 应用模板: ${template}`);
            });

            // ========== 第三步：处理去库存车型（历史 × 衰减）==========
            const clearStockVehicles = enabledVehicles.filter(v => v.type === 'clearStock');
            clearStockVehicles.forEach(vehicle => {
                // 先获取历史比例
                let historicalRatios;
                const samePeriodDays = countSamePeriodDays(vehicle.code);

                if (samePeriodDays >= 15) {
                    historicalRatios = calculateVehicleDailyRatios(vehicle.code);
                } else if (historicalWithSufficientData.length > 0) {
                    historicalRatios = calculateAverageRatios(results, historicalWithSufficientData.map(v => v.code));
                } else {
                    historicalRatios = calculateVehicleDailyRatios(vehicle.code);
                }

                // 生成衰减权重
                const clearStartDate = vehicle.clearStock.startDate;
                const clearEndDate = vehicle.clearStock.endDate;
                const decayWeights = generateClearStockWeights(
                    clearStartDate,
                    clearEndDate,
                    state.targetYear,
                    state.targetMonth
                );

                // 应用衰减：历史 × 衰减
                results[vehicle.code] = historicalRatios.map((dayData, index) => ({
                    ...dayData,
                    weight: dayData.weight * decayWeights[index],
                    ratio: dayData.ratio * decayWeights[index]
                }));

                // 重新归一化
                const totalRatio = results[vehicle.code].reduce((sum, d) => sum + d.ratio, 0);
                if (totalRatio > 0) {
                    results[vehicle.code].forEach(d => {
                        d.ratio = (d.ratio / totalRatio) * 100;
                    });
                }

                console.log(`✓ 去库存车型 "${vehicle.code}" 应用衰减`);
            });

            state.results = results;
            state.workflow.ratiosGenerated = true;

            displayResults();
            loading.classList.add('hidden');
            checkWorkflowState();

            console.log('比例生成完成');

        } catch (error) {
            alert('生成失败：' + error.message);
            loading.classList.add('hidden');
        }
    }, 500);
}

/**
 * 将权重数组转换为比例格式（新增车型专用）
 */
function convertWeightsToRatios(dailyWeights, vehicleCode) {
    const daysInMonth = dailyWeights.length;
    const ratios = [];

    // 先创建基础结构
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(state.targetYear, state.targetMonth - 1, day);
        const dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
        const holiday = getHoliday(date);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        // 格式化日期字符串
        const dateStr = `${state.targetYear}-${String(state.targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        ratios.push({
            day: day,
            date: dateStr,  // 添加完整的日期字符串
            dayOfWeek: dayOfWeek,
            holiday: holiday,
            isWeekend: isWeekend,  // 添加周末标识
            weight: dailyWeights[day - 1],
            ratio: 0  // 稍后计算
        });
    }

    // 计算比例
    const totalWeight = ratios.reduce((sum, d) => sum + d.weight, 0);
    if (totalWeight > 0) {
        ratios.forEach(d => {
            d.ratio = (d.weight / totalWeight) * 100;
        });
    } else {
        // 如果权重全为0，平均分配
        ratios.forEach(d => {
            d.ratio = 100 / daysInMonth;
        });
    }

    return ratios;
}

function getUniqueVehicles() {
    const vehicles = new Set();
    state.aggregatedData.forEach(row => vehicles.add(row.vehicle));
    return Array.from(vehicles).sort();
}

// ★ 统计车型在目标月份的历史同期数据天数
function countSamePeriodDays(vehicle) {
    if (!state.aggregatedData || !state.targetYear || !state.targetMonth) {
        return 0;
    }

    const vehicleData = state.aggregatedData.filter(row => row.vehicle === vehicle);
    const targetMonthDays = new Set();

    vehicleData.forEach(row => {
        const date = new Date(row.date);
        const month = date.getMonth() + 1;
        const day = date.getDate();

        // 统计与目标月份相同的月-日组合
        if (month === state.targetMonth) {
            targetMonthDays.add(day);
        }
    });

    return targetMonthDays.size;
}

// ★ 计算多个车型的平均每日比例
function calculateAverageRatios(results, vehicles) {
    if (!vehicles || vehicles.length === 0) {
        return generateDefaultRatios();
    }

    // 获取天数（从第一个车型的结果中获取）
    const daysInMonth = results[vehicles[0]].length;
    const averageRatios = [];

    // 对每一天计算平均比例
    for (let dayIndex = 0; dayIndex < daysInMonth; dayIndex++) {
        let totalWeight = 0;
        let totalRatio = 0;
        let sampleCount = 0;

        // 累加所有车型在这一天的权重和比例
        vehicles.forEach(vehicle => {
            if (results[vehicle] && results[vehicle][dayIndex]) {
                totalWeight += results[vehicle][dayIndex].weight || 0;
                totalRatio += results[vehicle][dayIndex].ratio || 0;
                sampleCount++;
            }
        });

        // 计算平均值
        const avgWeight = sampleCount > 0 ? totalWeight / sampleCount : 100;
        const avgRatio = sampleCount > 0 ? totalRatio / sampleCount : 100 / daysInMonth;

        // 复制第一个车型的结构，但使用平均值
        const dayData = { ...results[vehicles[0]][dayIndex] };
        dayData.weight = avgWeight;
        dayData.ratio = avgRatio;

        averageRatios.push(dayData);
    }

    // 归一化比例，确保总和为100%
    const totalRatioSum = averageRatios.reduce((sum, d) => sum + d.ratio, 0);
    if (totalRatioSum > 0) {
        averageRatios.forEach(d => {
            d.ratio = (d.ratio / totalRatioSum) * 100;
        });
    }

    return averageRatios;
}

// 已生成结果时，参数变化后静默重算并刷新视图（不显示 loading）
function autoRefreshResults() {
    if (!state.results) return;

    const enabledVehicles = Object.values(state.vehicleConfig).filter(v => v.enabled);
    const results = {};

    // ========== 第一步：处理历史车型 ==========
    const historicalVehicles = enabledVehicles.filter(v => v.type === 'historical');
    const historicalWithSufficientData = [];
    const historicalWithInsufficientData = [];

    historicalVehicles.forEach(vehicle => {
        const samePeriodDays = countSamePeriodDays(vehicle.code);
        if (samePeriodDays >= 15) {
            historicalWithSufficientData.push(vehicle);
            results[vehicle.code] = calculateVehicleDailyRatios(vehicle.code);
        } else {
            historicalWithInsufficientData.push(vehicle);
        }
    });

    // 对数据不足的历史车型使用平均比例
    if (historicalWithInsufficientData.length > 0) {
        if (historicalWithSufficientData.length > 0) {
            const averageRatios = calculateAverageRatios(results, historicalWithSufficientData.map(v => v.code));
            historicalWithInsufficientData.forEach(vehicle => {
                results[vehicle.code] = averageRatios.map(d => ({...d}));
            });
            state.vehiclesUsingAverageRatio = historicalWithInsufficientData.map(v => v.code);
        } else {
            historicalWithInsufficientData.forEach(vehicle => {
                results[vehicle.code] = calculateVehicleDailyRatios(vehicle.code);
            });
            state.vehiclesUsingAverageRatio = [];
        }
    } else {
        state.vehiclesUsingAverageRatio = [];
    }

    // ========== 第二步：处理新增车型（应用模板）==========
    const newVehicles = enabledVehicles.filter(v => v.type === 'new');
    newVehicles.forEach(vehicle => {
        const template = vehicle.newVehicle.template;
        const launchDate = vehicle.newVehicle.launchDate;
        const dailyWeights = applyVehicleTemplate(template, launchDate, state.targetYear, state.targetMonth);
        if (!dailyWeights) {
            results[vehicle.code] = generateDefaultRatios();
            return;
        }
        results[vehicle.code] = convertWeightsToRatios(dailyWeights, vehicle.code);
    });

    // ========== 第三步：处理去库存车型（历史 × 衰减）==========
    const clearStockVehicles = enabledVehicles.filter(v => v.type === 'clearStock');
    clearStockVehicles.forEach(vehicle => {
        let historicalRatios;
        const samePeriodDays = countSamePeriodDays(vehicle.code);
        if (samePeriodDays >= 15) {
            historicalRatios = calculateVehicleDailyRatios(vehicle.code);
        } else if (historicalWithSufficientData.length > 0) {
            historicalRatios = calculateAverageRatios(results, historicalWithSufficientData.map(v => v.code));
        } else {
            historicalRatios = calculateVehicleDailyRatios(vehicle.code);
        }
        const decayWeights = generateClearStockWeights(
            vehicle.clearStock.startDate, vehicle.clearStock.endDate,
            state.targetYear, state.targetMonth
        );
        results[vehicle.code] = historicalRatios.map((dayData, index) => ({
            ...dayData,
            weight: dayData.weight * decayWeights[index],
            ratio: dayData.ratio * decayWeights[index]
        }));
        const totalRatio = results[vehicle.code].reduce((sum, d) => sum + d.ratio, 0);
        if (totalRatio > 0) {
            results[vehicle.code].forEach(d => {
                d.ratio = (d.ratio / totalRatio) * 100;
            });
        }
    });

    state.results = results;

    // 保持当前选中的车型标签
    if (!state.results[state.currentVehicle]) {
        state.currentVehicle = Object.keys(state.results)[0];
    }
    renderVehicleTabs(Object.keys(state.results));
    renderResultsTable(state.currentVehicle);
    renderSummary(state.currentVehicle);
    displayHistoryData(state.currentVehicle);
    displayAverageRatioNotification();
}

function calculateVehicleDailyRatios(vehicle) {
    // 获取该车型的历史数据
    const vehicleData = state.aggregatedData.filter(row => row.vehicle === vehicle);

    if (vehicleData.length === 0) {
        return generateDefaultRatios();
    }

    // 按日期分组统计（用于同期优先，保存星期信息用于后续校正）
    const dateStats = {};
    vehicleData.forEach(row => {
        const date = new Date(row.date);
        const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        if (!dateStats[monthDay]) {
            dateStats[monthDay] = [];
        }
        dateStats[monthDay].push({
            amount: row.amount,
            weekday: date.getDay(),
            holiday: getHoliday(date)
        });
    });

    // 按星期几统计（0=周日, 1=周一, ..., 6=周六）
    const weekdayStats = {
        0: [], // 周日
        1: [], // 周一
        2: [], // 周二
        3: [], // 周三
        4: [], // 周四
        5: [], // 周五
        6: []  // 周六
    };

    // 节假日单独统计
    const holidayAmounts = [];

    vehicleData.forEach(row => {
        const date = new Date(row.date);
        const holiday = getHoliday(date);

        if (holiday) {
            // 节假日单独统计，保留日期用于近期加权
            holidayAmounts.push({ date: row.date, amount: row.amount });
        } else {
            // 按星期几分类，保留日期用于近期加权
            const dayOfWeek = date.getDay();
            weekdayStats[dayOfWeek].push({ date: row.date, amount: row.amount });
        }
    });

    // ★ 优化：对每个星期使用「异常值过滤 + 近期加权均值」
    const avgByWeekday = {};
    for (let day = 0; day <= 6; day++) {
        if (weekdayStats[day].length > 0) {
            const trimmed = trimOutliers(weekdayStats[day]);
            avgByWeekday[day] = weightedAvg(trimmed);
        }
    }

    // 如果某些星期没有数据，用工作日/周末的平均值填充
    const hasWeekdayData = [1, 2, 3, 4, 5].some(d => avgByWeekday[d]);
    const hasWeekendData = [0, 6].some(d => avgByWeekday[d]);

    if (hasWeekdayData) {
        const weekdayAvg = [1, 2, 3, 4, 5]
            .filter(d => avgByWeekday[d])
            .reduce((sum, d) => sum + avgByWeekday[d], 0) / [1, 2, 3, 4, 5].filter(d => avgByWeekday[d]).length;

        for (let day = 1; day <= 5; day++) {
            if (!avgByWeekday[day]) {
                avgByWeekday[day] = weekdayAvg;
            }
        }
    }

    if (hasWeekendData) {
        const weekendAvg = [0, 6]
            .filter(d => avgByWeekday[d])
            .reduce((sum, d) => sum + avgByWeekday[d], 0) / [0, 6].filter(d => avgByWeekday[d]).length;

        for (let day of [0, 6]) {
            if (!avgByWeekday[day]) {
                avgByWeekday[day] = weekendAvg;
            }
        }
    }

    // 如果完全没有数据，使用默认值
    if (Object.keys(avgByWeekday).length === 0) {
        for (let day = 0; day <= 6; day++) {
            avgByWeekday[day] = 100;
        }
    }

    // ★ 优化：节假日同样使用异常值过滤 + 近期加权均值
    const avgHoliday = holidayAmounts.length > 0
        ? weightedAvg(trimOutliers(holidayAmounts))
        : (avgByWeekday[1] || 100) * 0.5; // 如果没有节假日数据，用工作日的50%

    // ★ 优化：月末冲量效应——从历史数据自动学习月末最后3天的相对倍数
    const monthEndMultiplier = computeMonthEndMultiplier(vehicleData);

    // 为目标月份的每一天分配权重
    const daysInMonth = getDaysInMonth(state.targetYear, state.targetMonth);
    const dailyWeights = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(state.targetYear, state.targetMonth - 1, day);
        const dateStr = formatDate(date);
        const monthDay = `${String(state.targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const holiday = getHoliday(date);
        const dayOfWeek = date.getDay(); // 0=周日, 1=周一, ..., 6=周六

        let weight;

        // 检查是否有特殊节点
        const specialEvent = state.specialEvents.find(e => e.date === dateStr);

        // 判断是否使用历史同期数据
        // 调休上班日需要覆盖同期数据（去年可能是普通周末，今年算工作日）
        const isAdjustment = specialEvent && specialEvent.type === 'adjustment';
        if (!state.ignoreHistoryData && dateStats[monthDay] && !isAdjustment) {
            // ★ 修正星期偏移：同期日期与预测日期的星期几可能不同
            // 例：去年03-02是周日，今年03-02是周一，需按星期基准比率调整
            const targetBaseline = holiday ? avgHoliday : (avgByWeekday[dayOfWeek] || 100);
            const adjustedAmounts = dateStats[monthDay].map(item => {
                const srcBaseline = item.holiday ? avgHoliday : (avgByWeekday[item.weekday] || 100);
                return srcBaseline > 0 ? item.amount * (targetBaseline / srcBaseline) : item.amount;
            });
            weight = adjustedAmounts.reduce((a, b) => a + b, 0) / adjustedAmounts.length;
        } else if (specialEvent && specialEvent.type === 'adjustment') {
            // 调休上班日，使用对应星期几的工作日权重
            // 调休上班日通常是周六或周日，但算作工作日
            // 使用周一到周五的平均作为调休日权重
            const weekdayWeights = [1, 2, 3, 4, 5].map(d => avgByWeekday[d]).filter(w => w);
            weight = weekdayWeights.reduce((a, b) => a + b, 0) / weekdayWeights.length;
        } else if (holiday) {
            // 节假日使用节假日平均权重
            weight = avgHoliday;
        } else {
            // 使用该星期几的历史平均权重
            weight = avgByWeekday[dayOfWeek] || 100;
        }

        // 对其他特殊节点增加权重
        if (specialEvent) {
            if (specialEvent.type === 'promotion') {
                weight *= 1.5;  // 促销活动增加50%
            } else if (specialEvent.type === 'launch') {
                weight *= 1.8;  // 新车发布增加80%
            }
            // adjustment类型已经在上面处理，不额外加成
        }

        // ★ 月末冲量加成：最后3天，且未使用同期数据（同期数据已包含冲量规律），且非节假日
        const usedSamePeriod = !state.ignoreHistoryData && dateStats[monthDay] && !isAdjustment;
        if (!usedSamePeriod && !holiday && daysInMonth - day < 3) {
            weight *= monthEndMultiplier;
        }

        // 应用权重调整倍数
        // 调休上班日：按工作日倍数（而非周末倍数，因为今天实际作为工作日）
        if (holiday) {
            weight *= state.weightMultipliers.holiday;
        } else if (isAdjustment) {
            weight *= state.weightMultipliers.weekday;
        } else if (dayOfWeek === 0 || dayOfWeek === 6) {
            weight *= state.weightMultipliers.weekend;
        } else {
            weight *= state.weightMultipliers.weekday;
        }

        dailyWeights.push({
            date: dateStr,
            weight: weight,
            isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
            holiday: holiday,
            specialEvent: specialEvent
        });
    }

    // 归一化为百分比
    const totalWeight = dailyWeights.reduce((sum, d) => sum + d.weight, 0);
    const dailyRatios = dailyWeights.map(d => ({
        ...d,
        ratio: (d.weight / totalWeight) * 100
    }));

    return dailyRatios;
}

// ★ 异常值过滤：去除每组数据中 P10~P90 之外的极端值
// items: [{date, amount}, ...], 样本不足5条时不过滤
function trimOutliers(items) {
    if (items.length < 5) return items;
    const sorted = [...items].sort((a, b) => a.amount - b.amount);
    const lo = Math.floor(sorted.length * 0.1);
    const hi = Math.ceil(sorted.length * 0.9);
    return sorted.slice(lo, hi);
}

// ★ 近期加权平均：越近的数据权重越高（指数衰减）
// items: [{date, amount}, ...], decayPerSample 每步衰减系数（默认0.95）
// 例：52条周数据时，最新的权重=1，6个月前≈0.26，12个月前≈0.07
function weightedAvg(items, decayPerSample = 0.95) {
    if (items.length === 0) return null;
    const sorted = [...items].sort((a, b) => new Date(a.date) - new Date(b.date));
    const n = sorted.length;
    let weightedSum = 0, totalWeight = 0;
    sorted.forEach((pt, i) => {
        const w = Math.pow(decayPerSample, n - 1 - i); // 最新 i=n-1 → w=1
        weightedSum += pt.amount * w;
        totalWeight += w;
    });
    return weightedSum / totalWeight;
}

// ★ 月末冲量效应：从历史数据中自动学习月末最后3天相对月中的倍数
// vehicleData: [{date, amount}, ...] 某车型的全量聚合数据
function computeMonthEndMultiplier(vehicleData) {
    // 按年月分组
    const monthGroups = {};
    vehicleData.forEach(row => {
        const date = new Date(row.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthGroups[key]) monthGroups[key] = [];
        monthGroups[key].push({
            day: date.getDate(),
            amount: row.amount,
            daysInMonth: getDaysInMonth(date.getFullYear(), date.getMonth() + 1)
        });
    });

    const multipliers = [];
    for (const days of Object.values(monthGroups)) {
        const total = days[0].daysInMonth;
        // 月末：最后3天（排除节假日影响不在此处处理，保持简单）
        const lastThree = days.filter(d => total - d.day < 3);
        // 月中：第5天到倒数第4天（避免月初月末效应）
        const middle = days.filter(d => d.day >= 5 && total - d.day >= 3);
        if (lastThree.length >= 2 && middle.length >= 5) {
            const lastAvg = lastThree.reduce((s, d) => s + d.amount, 0) / lastThree.length;
            const midAvg = middle.reduce((s, d) => s + d.amount, 0) / middle.length;
            if (midAvg > 0) multipliers.push(lastAvg / midAvg);
        }
    }

    if (multipliers.length === 0) return 1.0;
    const avg = multipliers.reduce((a, b) => a + b, 0) / multipliers.length;
    // 限制在合理范围内，避免极端值
    return Math.max(0.8, Math.min(3.0, avg));
}

function generateDefaultRatios() {
    // 如果没有历史数据，使用简单平均分配
    const daysInMonth = getDaysInMonth(state.targetYear, state.targetMonth);
    const dailyRatios = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(state.targetYear, state.targetMonth - 1, day);
        const dateStr = formatDate(date);

        dailyRatios.push({
            date: dateStr,
            ratio: 100 / daysInMonth,
            isWeekend: isWeekend(date),
            holiday: getHoliday(date),
            specialEvent: state.specialEvents.find(e => e.date === dateStr)
        });
    }

    return dailyRatios;
}

// ============== 目标量拆分 ==============

// 最大余数法：确保拆分整数之和严格等于目标总量
function splitTargetByRatios(vehicle) {
    const target = state.vehicleTargets[vehicle];
    if (!target || target <= 0 || !state.results || !state.results[vehicle]) return null;

    const ratios = state.results[vehicle];
    const exactValues = ratios.map(d => d.ratio / 100 * target);
    const floorValues = exactValues.map(v => Math.floor(v));

    const distributed = floorValues.reduce((a, b) => a + b, 0);
    const extra = Math.round(target - distributed); // 需要额外分配的 1

    // 按小数部分降序，将余量优先分给余数最大的日期
    const remainders = exactValues.map((v, i) => ({
        index: i,
        remainder: v - Math.floor(v)
    }));
    remainders.sort((a, b) => b.remainder - a.remainder);

    const allocations = [...floorValues];
    for (let i = 0; i < extra; i++) {
        allocations[remainders[i].index]++;
    }

    return allocations;
}

function updateTargetInput(vehicle) {
    const targetSplitArea = document.getElementById('targetSplitArea');
    const vehicleTargetLabel = document.getElementById('targetVehicleLabel');
    const vehicleTargetInput = document.getElementById('vehicleTargetInput');
    const targetSplitFeedback = document.getElementById('targetSplitFeedback');
    const clearTargetBtn = document.getElementById('clearTargetBtn');

    targetSplitArea.style.display = '';
    vehicleTargetLabel.textContent = vehicle;

    // 确保输入框是启用的（从汇总视图切换回来时需要）
    vehicleTargetInput.disabled = false;

    const existingTarget = state.vehicleTargets[vehicle];
    vehicleTargetInput.value = existingTarget || '';

    if (existingTarget) {
        targetSplitFeedback.textContent = `已设置目标 ${existingTarget.toLocaleString()}，拆分量已显示在表格中`;
        targetSplitFeedback.className = 'target-split-feedback success';
        clearTargetBtn.style.display = '';
    } else {
        targetSplitFeedback.textContent = '输入后自动按比例拆分到每日，总量严格等于目标';
        targetSplitFeedback.className = 'target-split-feedback hint';
        clearTargetBtn.style.display = 'none';
    }
}

function initializeTargetInput() {
    const vehicleTargetInput = document.getElementById('vehicleTargetInput');
    const clearTargetBtn = document.getElementById('clearTargetBtn');

    vehicleTargetInput.addEventListener('input', function() {
        const val = parseInt(this.value);
        const vehicle = state.currentVehicle;

        // 跳过汇总视图
        if (!vehicle || vehicle === '__SUMMARY__') return;

        if (val && val > 0) {
            state.vehicleTargets[vehicle] = val;
        } else {
            delete state.vehicleTargets[vehicle];
        }

        updateTargetInput(vehicle);
        renderResultsTable(vehicle);
        renderSummary(vehicle);

        // 检查是否所有车型都设置了目标，如果是则显示门店分配
        checkAndShowStoreAllocation();
    });

    clearTargetBtn.addEventListener('click', function() {
        const vehicle = state.currentVehicle;

        // 跳过汇总视图
        if (!vehicle || vehicle === '__SUMMARY__') return;

        delete state.vehicleTargets[vehicle];
        document.getElementById('vehicleTargetInput').value = '';
        updateTargetInput(vehicle);
        renderResultsTable(vehicle);
        renderSummary(vehicle);

        // 检查是否需要隐藏门店分配
        checkAndShowStoreAllocation();
    });
}

// ============== 结果展示 ==============
function displayResults() {
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.classList.remove('hidden');

    const vehicles = Object.keys(state.results);

    // 默认显示历史车型汇总（如果有历史车型）
    const historicalCount = vehicles.filter(code => {
        const config = state.vehicleConfig[code];
        return config && config.enabled && (config.type === 'historical' || config.type === 'clearStock');
    }).length;

    if (historicalCount >= 1) {
        state.currentVehicle = '__HISTORICAL_SUMMARY__';
    } else {
        state.currentVehicle = vehicles[0];
    }

    renderVehicleTabs(vehicles);
    switchVehicle(state.currentVehicle);  // 使用switchVehicle统一处理

    // ★ 显示使用平均比例的车型提示（如果需要的话可以移除）
    // displayAverageRatioNotification();

    // 滚动到结果区域
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// 显示使用平均比例的车型通知
function displayAverageRatioNotification() {
    // 查找或创建通知区域
    let notificationArea = document.getElementById('averageRatioNotification');

    if (state.vehiclesUsingAverageRatio && state.vehiclesUsingAverageRatio.length > 0) {
        if (!notificationArea) {
            // 创建通知区域
            const resultsSection = document.getElementById('resultsSection');
            const cardBody = resultsSection.querySelector('.card-body');

            notificationArea = document.createElement('div');
            notificationArea.id = 'averageRatioNotification';
            notificationArea.style.cssText = `
                background: #fff3cd;
                border: 1px solid #ffc107;
                border-radius: 8px;
                padding: 15px 20px;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 12px;
            `;

            cardBody.insertBefore(notificationArea, cardBody.firstChild);
        }

        const vehicleList = state.vehiclesUsingAverageRatio.join('、');
        notificationArea.innerHTML = `
            <span style="font-size: 20px;">ℹ️</span>
            <div style="flex: 1;">
                <div style="font-weight: 600; color: #856404; margin-bottom: 4px;">数据优化提示</div>
                <div style="color: #856404; font-size: 14px;">
                    以下车型的同期历史数据少于15天，已自动采用其他车型的平均比例：
                    <strong>${vehicleList}</strong>
                </div>
            </div>
        `;

        notificationArea.style.display = 'flex';
    } else if (notificationArea) {
        // 隐藏通知区域
        notificationArea.style.display = 'none';
    }
}

function renderVehicleTabs(vehicles) {
    const vehicleTabs = document.getElementById('vehicleTabs');
    const tabs = [];

    // 分类车型
    const historicalVehicles = [];
    const newVehicles = [];
    const clearStockVehicles = [];

    vehicles.forEach(vehicleCode => {
        const config = state.vehicleConfig[vehicleCode];
        if (!config || !config.enabled) return;

        if (config.type === 'historical') {
            historicalVehicles.push(vehicleCode);
        } else if (config.type === 'clearStock') {
            clearStockVehicles.push(vehicleCode);
        } else if (config.type === 'new') {
            newVehicles.push(vehicleCode);
        }
    });

    // 1. 历史车型汇总（如果有多个历史车型+去库存车型）
    const totalHistoricalCount = historicalVehicles.length + clearStockVehicles.length;
    if (totalHistoricalCount >= 1) {
        const isActive = state.currentVehicle === '__HISTORICAL_SUMMARY__';
        tabs.push(`
            <div class="vehicle-tab ${isActive ? 'active' : ''}"
                 data-vehicle="__HISTORICAL_SUMMARY__"
                 onclick="switchVehicle('__HISTORICAL_SUMMARY__')"
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: 600;">
                📊 历史车型汇总
            </div>
        `);
    }

    // 2. 各历史车型
    historicalVehicles.forEach(vehicle => {
        const isActive = vehicle === state.currentVehicle;
        tabs.push(`
            <div class="vehicle-tab ${isActive ? 'active' : ''}"
                 data-vehicle="${vehicle}"
                 onclick="switchVehicle('${vehicle}')">
                ${vehicle}
            </div>
        `);
    });

    // 3. 去库存车型
    clearStockVehicles.forEach(vehicle => {
        const isActive = vehicle === state.currentVehicle;
        const config = state.vehicleConfig[vehicle];
        tabs.push(`
            <div class="vehicle-tab ${isActive ? 'active' : ''}"
                 data-vehicle="${vehicle}"
                 onclick="switchVehicle('${vehicle}')"
                 style="background: #FFF3E0; border-color: #FFE0B2;">
                📉 ${vehicle}
            </div>
        `);
    });

    // 4. 新增车型
    newVehicles.forEach(vehicle => {
        const isActive = vehicle === state.currentVehicle;
        const config = state.vehicleConfig[vehicle];
        tabs.push(`
            <div class="vehicle-tab ${isActive ? 'active' : ''}"
                 data-vehicle="${vehicle}"
                 onclick="switchVehicle('${vehicle}')"
                 style="background: #E3F2FD; border-color: #BBDEFB;">
                🆕 ${vehicle}
            </div>
        `);
    });

    // 5. 总览
    const isTotalActive = state.currentVehicle === '__TOTAL_SUMMARY__';
    tabs.push(`
        <div class="vehicle-tab ${isTotalActive ? 'active' : ''}"
             data-vehicle="__TOTAL_SUMMARY__"
             onclick="switchVehicle('__TOTAL_SUMMARY__')"
             style="background: #F5F5F5; border-color: #E0E0E0; color: #666;">
            📈 总览
        </div>
    `);

    vehicleTabs.innerHTML = tabs.join('');
}

function switchVehicle(vehicle) {
    state.currentVehicle = vehicle;
    renderVehicleTabs(Object.keys(state.results));

    // 根据不同类型的视图渲染不同的内容
    if (vehicle === '__HISTORICAL_SUMMARY__') {
        renderHistoricalSummaryView();
    } else if (vehicle === '__TOTAL_SUMMARY__') {
        renderTotalSummaryView();
    } else {
        renderResultsTable(vehicle);
        renderSummary(vehicle);
        displayHistoryData(vehicle);
        updateTargetInput(vehicle);
    }

    // 更新图表
    if (window.updateChartForVehicle) {
        window.updateChartForVehicle(vehicle);
    }
}

/**
 * 渲染历史车型汇总视图
 */
function renderHistoricalSummaryView() {
    // 获取所有历史车型（包括去库存）
    const historicalVehicles = Object.keys(state.results).filter(code => {
        const config = state.vehicleConfig[code];
        return config && config.enabled && (config.type === 'historical' || config.type === 'clearStock');
    });

    if (historicalVehicles.length === 0) {
        alert('没有历史车型数据');
        return;
    }

    // 计算汇总
    const daysInMonth = state.results[historicalVehicles[0]].length;
    const summaryData = [];

    for (let dayIndex = 0; dayIndex < daysInMonth; dayIndex++) {
        const firstDayData = state.results[historicalVehicles[0]][dayIndex];
        let totalWeight = 0;
        let totalRatio = 0;

        historicalVehicles.forEach(vehicle => {
            totalWeight += state.results[vehicle][dayIndex].weight || 0;
            totalRatio += state.results[vehicle][dayIndex].ratio || 0;
        });

        summaryData.push({
            ...firstDayData,
            weight: totalWeight / historicalVehicles.length,
            ratio: totalRatio / historicalVehicles.length
        });
    }

    // 归一化
    const totalRatioSum = summaryData.reduce((sum, d) => sum + d.ratio, 0);
    if (totalRatioSum > 0) {
        summaryData.forEach(d => {
            d.ratio = (d.ratio / totalRatioSum) * 100;
        });
    }

    // 使用汇总数据渲染表格
    state.results['__HISTORICAL_SUMMARY__'] = summaryData;
    renderResultsTable('__HISTORICAL_SUMMARY__');
    renderSummary('__HISTORICAL_SUMMARY__');

    // 隐藏去年同期面板
    const historyPanel = document.getElementById('historyPanel');
    if (historyPanel) {
        historyPanel.style.display = 'none';
    }

    updateTargetInput('__HISTORICAL_SUMMARY__');
}

/**
 * 渲染总览视图
 */
function renderTotalSummaryView() {
    const allVehicles = Object.keys(state.results).filter(code => {
        return code !== '__HISTORICAL_SUMMARY__' && code !== '__TOTAL_SUMMARY__';
    }).filter(code => {
        const config = state.vehicleConfig[code];
        return config && config.enabled;
    });

    if (allVehicles.length === 0) {
        alert('没有车型数据');
        return;
    }

    // 计算总和
    const daysInMonth = state.results[allVehicles[0]].length;
    const totalData = [];

    for (let dayIndex = 0; dayIndex < daysInMonth; dayIndex++) {
        const firstDayData = state.results[allVehicles[0]][dayIndex];
        let totalWeight = 0;
        let totalRatio = 0;

        allVehicles.forEach(vehicle => {
            totalWeight += state.results[vehicle][dayIndex].weight || 0;
            totalRatio += state.results[vehicle][dayIndex].ratio || 0;
        });

        totalData.push({
            ...firstDayData,
            weight: totalWeight,
            ratio: totalRatio
        });
    }

    // 归一化
    const totalRatioSum = totalData.reduce((sum, d) => sum + d.ratio, 0);
    if (totalRatioSum > 0) {
        totalData.forEach(d => {
            d.ratio = (d.ratio / totalRatioSum) * 100;
        });
    }

    // 使用总览数据渲染表格
    state.results['__TOTAL_SUMMARY__'] = totalData;
    renderResultsTable('__TOTAL_SUMMARY__');
    renderSummary('__TOTAL_SUMMARY__');

    // 隐藏去年同期面板
    const historyPanel = document.getElementById('historyPanel');
    if (historyPanel) {
        historyPanel.style.display = 'none';
    }

    updateTargetInput('__TOTAL_SUMMARY__');
}

function renderResultsTable(vehicle) {
    const resultsBody = document.getElementById('resultsBody');
    const resultsTableHead = document.querySelector('#resultsTable thead tr');
    const ratios = state.results[vehicle];
    const allocations = splitTargetByRatios(vehicle);

    // 动态更新表头：有目标量时追加拆分量列
    if (allocations) {
        resultsTableHead.innerHTML = `
            <th>日期</th>
            <th>星期</th>
            <th>节假日/特殊节点</th>
            <th>每日比例</th>
            <th>累计比例</th>
            <th>拆分量</th>
            <th>累计拆分量</th>
        `;
    } else {
        resultsTableHead.innerHTML = `
            <th>日期</th>
            <th>星期</th>
            <th>节假日/特殊节点</th>
            <th>每日比例</th>
            <th>累计比例</th>
        `;
    }

    let cumulativeRatio = 0;
    let cumulativeAlloc = 0;

    resultsBody.innerHTML = ratios.map((day, i) => {
        cumulativeRatio += day.ratio;

        const date = new Date(day.date);
        const weekday = getWeekday(date);

        let rowClass = '';
        if (day.specialEvent) {
            if (day.specialEvent.type === 'adjustment') {
                rowClass = 'adjustment';
            } else {
                rowClass = 'special-event';
            }
        } else if (day.holiday) {
            rowClass = 'holiday';
        } else if (day.isWeekend) {
            rowClass = 'weekend';
        }

        let tags = [];
        if (day.holiday) {
            tags.push(`<span class="tag tag-holiday">${day.holiday}</span>`);
        } else if (day.isWeekend) {
            tags.push('<span class="tag tag-weekend">周末</span>');
        }

        if (day.specialEvent) {
            const tagClass = `tag-${day.specialEvent.type}`;
            tags.push(`<span class="tag ${tagClass}">${day.specialEvent.name}</span>`);
        }

        let allocationCells = '';
        if (allocations) {
            cumulativeAlloc += allocations[i];
            allocationCells = `
                <td><strong>${allocations[i].toLocaleString()}</strong></td>
                <td>${cumulativeAlloc.toLocaleString()}</td>
            `;
        }

        return `
            <tr class="${rowClass}">
                <td>${day.date}</td>
                <td>${weekday}</td>
                <td>${tags.join(' ') || '-'}</td>
                <td><strong>${day.ratio.toFixed(2)}%</strong></td>
                <td>${cumulativeRatio.toFixed(2)}%</td>
                ${allocationCells}
            </tr>
        `;
    }).join('');
}

function renderSummary(vehicle) {
    const summaryInfo = document.getElementById('summaryInfo');
    const ratios = state.results[vehicle];
    const allocations = splitTargetByRatios(vehicle);

    const totalRatio = ratios.reduce((sum, d) => sum + d.ratio, 0);
    const avgRatio = totalRatio / ratios.length;
    const maxDay = ratios.reduce((max, d) => d.ratio > max.ratio ? d : max);
    const minDay = ratios.reduce((min, d) => d.ratio < min.ratio ? d : min);

    // 按日期类型分类统计比例
    let weekdayRatio = 0, weekdayCount = 0;
    let weekendRatio = 0, weekendCount = 0;
    let holidayRatio = 0, holidayCount = 0;

    ratios.forEach(day => {
        const date = new Date(day.date);
        const holiday = getHoliday(date);
        const isWknd = isWeekend(date);
        const isAdjustment = state.specialEvents.some(e =>
            e.date === day.date && e.type === 'adjustment'
        );

        if (isAdjustment || (!holiday && !isWknd)) {
            weekdayRatio += day.ratio;
            weekdayCount++;
        } else if (holiday) {
            holidayRatio += day.ratio;
            holidayCount++;
        } else if (isWknd) {
            weekendRatio += day.ratio;
            weekendCount++;
        }
    });

    let allocationBlock = '';
    if (allocations && state.vehicleTargets[vehicle]) {
        const totalAlloc = allocations.reduce((a, b) => a + b, 0);
        const avgAlloc = totalAlloc / allocations.length;
        const maxAllocIdx = allocations.indexOf(Math.max(...allocations));
        allocationBlock = `
            <h3 style="margin-top:20px;margin-bottom:12px;font-size:16px;">拆分统计 - ${vehicle}</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="label">月度目标</div>
                    <div class="value">${state.vehicleTargets[vehicle].toLocaleString()}</div>
                </div>
                <div class="summary-item">
                    <div class="label">拆分总量</div>
                    <div class="value" style="color:var(--success-color)">${totalAlloc.toLocaleString()} ✓</div>
                </div>
                <div class="summary-item">
                    <div class="label">日均拆分</div>
                    <div class="value">${avgAlloc.toFixed(1)}</div>
                </div>
                <div class="summary-item">
                    <div class="label">最高拆分日</div>
                    <div class="value" style="font-size:14px">${ratios[maxAllocIdx].date}<br>${allocations[maxAllocIdx].toLocaleString()}</div>
                </div>
            </div>
        `;
    }

    summaryInfo.innerHTML = `
        <h3>统计摘要 - ${vehicle}</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="label">总计比例</div>
                <div class="value">${totalRatio.toFixed(2)}%</div>
            </div>
            <div class="summary-item">
                <div class="label">日均比例</div>
                <div class="value">${avgRatio.toFixed(2)}%</div>
            </div>
            <div class="summary-item">
                <div class="label">工作日占比</div>
                <div class="value" style="font-size:16px">${weekdayRatio.toFixed(2)}%<br><span style="font-size:12px;color:#86909C;font-weight:400">${weekdayCount}天 · 日均${(weekdayRatio/weekdayCount).toFixed(2)}%</span></div>
            </div>
            <div class="summary-item">
                <div class="label">周末占比</div>
                <div class="value" style="font-size:16px">${weekendRatio.toFixed(2)}%<br><span style="font-size:12px;color:#86909C;font-weight:400">${weekendCount}天 · 日均${weekendCount > 0 ? (weekendRatio/weekendCount).toFixed(2) : 0}%</span></div>
            </div>
            <div class="summary-item">
                <div class="label">节假日占比</div>
                <div class="value" style="font-size:16px">${holidayRatio.toFixed(2)}%<br><span style="font-size:12px;color:#86909C;font-weight:400">${holidayCount}天 · 日均${holidayCount > 0 ? (holidayRatio/holidayCount).toFixed(2) : 0}%</span></div>
            </div>
            <div class="summary-item">
                <div class="label">最高日期</div>
                <div class="value" style="font-size: 14px;">${maxDay.date}<br>${maxDay.ratio.toFixed(2)}%</div>
            </div>
            <div class="summary-item">
                <div class="label">最低日期</div>
                <div class="value" style="font-size: 14px;">${minDay.date}<br>${minDay.ratio.toFixed(2)}%</div>
            </div>
        </div>
        ${allocationBlock}
    `;
}

// ============== 去年同期参考 ==============
function displayHistoryData(vehicle) {
    const historyPanel = document.getElementById('historyPanel');
    const historyBody = document.getElementById('historyBody');
    const historyNote = document.getElementById('historyNote');
    const historySummary = document.getElementById('historySummary');

    // 对于新增车型，直接隐藏历史面板
    const vehicleConfig = state.vehicleConfig[vehicle];
    if (vehicleConfig && vehicleConfig.type === 'new') {
        if (historyPanel) {
            historyPanel.style.display = 'none';
        }
        console.log('新增车型无历史数据，隐藏历史面板');
        return;
    }

    // 显示历史面板（对于历史车型和去库存车型）
    if (historyPanel) {
        historyPanel.style.display = 'block';
    }

    const lastYear = state.targetYear - 1;
    const targetMonth = state.targetMonth;

    // 判断是否需要汇总所有车型的数据
    const isShowingAll = !vehicle || vehicle === '__SUMMARY__' || vehicle === '__ALL__';

    let samePeriodData;
    if (isShowingAll) {
        // 汇总所有车型：按日期聚合
        const dateAggregated = {};
        state.aggregatedData.forEach(row => {
            const date = new Date(row.date);
            if (date.getFullYear() === lastYear && (date.getMonth() + 1) === targetMonth) {
                const dateStr = row.date;
                if (!dateAggregated[dateStr]) {
                    dateAggregated[dateStr] = {
                        date: dateStr,
                        vehicle: '全部车型',
                        amount: 0
                    };
                }
                dateAggregated[dateStr].amount += row.amount;
            }
        });
        samePeriodData = Object.values(dateAggregated);
    } else {
        // 单个车型
        samePeriodData = state.aggregatedData.filter(row => {
            if (row.vehicle !== vehicle) return false;
            const date = new Date(row.date);
            return date.getFullYear() === lastYear && (date.getMonth() + 1) === targetMonth;
        });
    }

    // 🔍 调试：输出筛选条件和结果
    console.log('🔍 displayHistoryData:', {
        vehicle: vehicle,
        isShowingAll: isShowingAll,
        lastYear: lastYear,
        targetMonth: targetMonth,
        totalRecords: state.aggregatedData.length,
        filteredRecords: samePeriodData.length,
        sampleData: samePeriodData.slice(0, 3)
    });

    if (samePeriodData.length === 0) {
        historyNote.innerHTML = '';
        historyNote.style.display = 'none';
        historyBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:#8c8c8c;">上传数据中未找到去年同期记录</td></tr>';
        historySummary.innerHTML = '';
        return;
    }

    samePeriodData.sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalAmount = samePeriodData.reduce((sum, row) => sum + row.amount, 0);

    // 隐藏月度汇总信息
    historyNote.innerHTML = '';
    historyNote.style.display = 'none';

    let cumulative = 0;
    historyBody.innerHTML = samePeriodData.map(row => {
        const date = new Date(row.date);
        const weekday = getWeekday(date);
        const holiday = getHoliday(date);
        const isWknd = isWeekend(date);
        const ratio = totalAmount > 0 ? (row.amount / totalAmount) * 100 : 0;
        cumulative += ratio;

        let rowClass = '';
        if (holiday) rowClass = 'holiday';
        else if (isWknd) rowClass = 'weekend';

        let tags = [];
        if (holiday) tags.push(`<span class="tag tag-holiday">${holiday}</span>`);
        else if (isWknd) tags.push('<span class="tag tag-weekend">周末</span>');

        return `
            <tr class="${rowClass}">
                <td>${row.date}</td>
                <td>${weekday}</td>
                <td>${tags.join(' ') || '-'}</td>
                <td><strong>${row.amount.toLocaleString()}</strong></td>
                <td><strong>${ratio.toFixed(2)}%</strong></td>
                <td>${cumulative.toFixed(2)}%</td>
            </tr>
        `;
    }).join('');

    const maxDay = samePeriodData.reduce((max, d) => d.amount > max.amount ? d : max);
    const minDay = samePeriodData.reduce((min, d) => d.amount < min.amount ? d : min);
    const avgAmount = totalAmount / samePeriodData.length;

    // 按日期类型分类统计
    let weekdayAmount = 0, weekdayCount = 0;
    let weekendAmount = 0, weekendCount = 0;
    let holidayAmount = 0, holidayCount = 0;

    samePeriodData.forEach(row => {
        const date = new Date(row.date);
        const holiday = getHoliday(date);
        const isWknd = isWeekend(date);

        if (holiday) {
            holidayAmount += row.amount;
            holidayCount++;
        } else if (isWknd) {
            weekendAmount += row.amount;
            weekendCount++;
        } else {
            weekdayAmount += row.amount;
            weekdayCount++;
        }
    });

    historySummary.innerHTML = `
        <h3>统计摘要 - ${vehicle} 同期参考</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="label">月合计</div>
                <div class="value">${totalAmount.toLocaleString()}</div>
            </div>
            <div class="summary-item">
                <div class="label">日均量</div>
                <div class="value">${Math.round(avgAmount).toLocaleString()}</div>
            </div>
            <div class="summary-item">
                <div class="label">工作日实际量</div>
                <div class="value" style="font-size:16px">${weekdayAmount.toLocaleString()}<br><span style="font-size:12px;color:#86909C;font-weight:400">${weekdayCount}天 · 日均${Math.round(weekdayAmount/weekdayCount).toLocaleString()}</span></div>
            </div>
            <div class="summary-item">
                <div class="label">周末实际量</div>
                <div class="value" style="font-size:16px">${weekendAmount.toLocaleString()}<br><span style="font-size:12px;color:#86909C;font-weight:400">${weekendCount}天 · 日均${weekendCount > 0 ? Math.round(weekendAmount/weekendCount).toLocaleString() : 0}</span></div>
            </div>
            <div class="summary-item">
                <div class="label">节假日实际量</div>
                <div class="value" style="font-size:16px">${holidayAmount.toLocaleString()}<br><span style="font-size:12px;color:#86909C;font-weight:400">${holidayCount}天 · 日均${holidayCount > 0 ? Math.round(holidayAmount/holidayCount).toLocaleString() : 0}</span></div>
            </div>
            <div class="summary-item">
                <div class="label">最高日期</div>
                <div class="value" style="font-size:14px">${maxDay.date}<br>${maxDay.amount.toLocaleString()}</div>
            </div>
            <div class="summary-item">
                <div class="label">最低日期</div>
                <div class="value" style="font-size:14px">${minDay.date}<br>${minDay.amount.toLocaleString()}</div>
            </div>
        </div>
    `;
}

// ============== 导出Excel ==============
function initializeExportButton() {
    const exportBtn = document.getElementById('exportBtn');
    const exportHorizontalBtn = document.getElementById('exportHorizontalBtn');

    exportBtn.addEventListener('click', exportToExcel);
    exportHorizontalBtn.addEventListener('click', exportToExcelHorizontal);
}

function exportToExcel() {
    if (!state.results) {
        alert('请先生成分配比例');
        return;
    }

    const wb = XLSX.utils.book_new();

    // 为每个车型创建一个工作表（排除伪车型）
    Object.keys(state.results).filter(v => !v.startsWith('__')).forEach(vehicle => {
        const ratios = state.results[vehicle];

        // 优先使用调整后的数据，如果没有则使用原始拆分
        let allocations = null;
        if (window.chartData && window.chartData.adjustedVehicleData && window.chartData.adjustedVehicleData[vehicle]) {
            // 使用汇总视图的手动调整后数据（整数）
            allocations = window.chartData.adjustedVehicleData[vehicle];
        } else {
            // 使用原始拆分函数
            allocations = splitTargetByRatios(vehicle);
        }

        const headers = ['日期', '星期', '节假日/特殊节点', '每日比例(%)', '累计比例(%)'];
        if (allocations) {
            headers.push('拆分量', '累计拆分量');
        }

        const sheetData = [headers];

        let cumulative = 0;
        let cumulativeAlloc = 0;
        ratios.forEach((day, i) => {
            cumulative += day.ratio;
            const date = new Date(day.date);
            const weekday = getWeekday(date);

            let tags = [];
            if (day.isWeekend) tags.push('周末');
            if (day.holiday) tags.push(day.holiday);
            if (day.specialEvent) tags.push(day.specialEvent.name);

            const row = [
                day.date,
                weekday,
                tags.join(', ') || '-',
                day.ratio.toFixed(2),
                cumulative.toFixed(2)
            ];

            if (allocations) {
                cumulativeAlloc += allocations[i];
                row.push(allocations[i], cumulativeAlloc);
            }

            sheetData.push(row);
        });

        const ws = XLSX.utils.aoa_to_sheet(sheetData);

        // 设置列宽
        ws['!cols'] = [
            { wch: 12 },
            { wch: 8 },
            { wch: 20 },
            { wch: 12 },
            { wch: 12 },
            ...(allocations ? [{ wch: 10 }, { wch: 12 }] : [])
        ];

        XLSX.utils.book_append_sheet(wb, ws, vehicle);
    });

    // 生成文件名
    const fileName = `商机日节奏_${state.targetYear}年${state.targetMonth}月_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

// ============== 横向日期格式导出 ==============
function exportToExcelHorizontal() {
    if (!state.results) {
        alert('请先生成分配比例');
        return;
    }

    const wb = XLSX.utils.book_new();

    // 获取所有车型（排除伪车型）
    const vehicles = Object.keys(state.results).filter(v => !v.startsWith('__'));

    // 获取目标月份的所有日期
    const daysInMonth = getDaysInMonth(state.targetYear, state.targetMonth);
    const dates = [];
    for (let day = 1; day <= daysInMonth; day++) {
        dates.push(`${state.targetMonth}/${day}`);
    }

    // 构建表头：车型 | 日期1 | 日期2 | ... | 日期N | 合计
    const headers = ['车型', ...dates, '合计'];
    const sheetData = [headers];

    // 为每个车型添加一行数据
    vehicles.forEach(vehicle => {
        const ratios = state.results[vehicle];

        // 优先使用调整后的数据，如果没有则使用原始拆分
        let allocations = null;
        if (window.chartData && window.chartData.adjustedVehicleData && window.chartData.adjustedVehicleData[vehicle]) {
            // 使用汇总视图的手动调整后数据（整数）
            allocations = window.chartData.adjustedVehicleData[vehicle];
        } else {
            // 使用原始拆分函数
            allocations = splitTargetByRatios(vehicle);
        }

        const row = [vehicle];

        // 如果有目标量拆分，使用拆分量；否则使用比例
        if (allocations) {
            // 使用拆分量
            allocations.forEach(alloc => {
                row.push(alloc);
            });
            // 计算合计
            const total = allocations.reduce((sum, val) => sum + val, 0);
            row.push(total);
        } else {
            // 使用比例（保留2位小数）
            ratios.forEach(day => {
                row.push(parseFloat(day.ratio.toFixed(2)));
            });
            // 计算合计
            const total = ratios.reduce((sum, day) => sum + day.ratio, 0);
            row.push(parseFloat(total.toFixed(2)));
        }

        sheetData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // 设置列宽
    const colWidths = [
        { wch: 10 }, // 车型列
        ...dates.map(() => ({ wch: 8 })), // 日期列
        { wch: 10 } // 合计列
    ];
    ws['!cols'] = colWidths;

    // 添加工作表
    const sheetName = `${state.targetYear}年${state.targetMonth}月`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // 生成文件名
    const fileName = `商机日节奏_横向_${state.targetYear}年${state.targetMonth}月_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

// ============== 暴露到全局作用域 ==============
window.switchVehicle = switchVehicle;
window.removeSpecialEvent = removeSpecialEvent;

// ============== 区域选择处理 ==============
function handleRegionChange() {
    const regionSelect = document.getElementById('regionSelect');
    const regionFeedback = document.getElementById('regionFeedback');
    const selectedRegion = regionSelect.value;

    if (selectedRegion) {
        state.selectedRegion = selectedRegion;
        state.workflow.regionSelected = true;  // 更新workflow状态
        regionFeedback.textContent = `✓ 已选择：${selectedRegion}（包含 ${regionsData[selectedRegion].stores.length} 个门店）`;
        regionFeedback.style.color = '#28a745';
        regionFeedback.style.fontWeight = '600';

        // 检查按钮状态
        checkWorkflowState();

        console.log('步骤1完成：区域已选择');
    } else {
        state.selectedRegion = null;
        state.workflow.regionSelected = false;
        regionFeedback.textContent = '';
        checkWorkflowState();
    }
}

window.handleRegionChange = handleRegionChange;

// ============== 门店分配触发 ==============
function checkAndShowStoreAllocation() {
    console.log('=== checkAndShowStoreAllocation 被调用 ===');
    console.log('state.results:', state.results);
    console.log('state.selectedRegion:', state.selectedRegion);
    console.log('state.vehicleTargets:', state.vehicleTargets);

    if (!state.results) {
        console.log('❌ 没有生成结果数据');
        return;
    }

    const vehicles = Object.keys(state.results).filter(v => !v.startsWith('__'));
    const allVehiclesHaveTargets = vehicles.every(vehicle => state.vehicleTargets[vehicle] > 0);

    console.log('vehicles:', vehicles);
    console.log('allVehiclesHaveTargets:', allVehiclesHaveTargets);

    const storeAllocationSection = document.getElementById('storeAllocationSection');

    if (allVehiclesHaveTargets && vehicles.length > 0 && state.selectedRegion) {
        console.log('✅ 所有条件满足，显示门店分配');

        // 所有车型都设置了目标，且已选择区域，显示门店分配区域
        storeAllocationSection.classList.remove('hidden');

        const region = regionsData[state.selectedRegion];
        const regionTotal = Object.values(state.vehicleTargets).reduce((sum, val) => sum + val, 0);

        console.log('region:', region);
        console.log('regionTotal:', regionTotal);

        // ★ 不自动初始化门店分配，等待用户上传文件
        // 如果没有门店分配数据，初始化为空（所有门店目标为0）
        if (Object.keys(state.storeAllocations).length === 0) {
            console.log('初始化门店分配数据为空...');
            state.storeAllocations = {};
            region.stores.forEach(store => {
                state.storeAllocations[store] = 0;
            });
        }

        // 初始化门店分配图表/表格
        if (typeof window.initializeStoreAllocationChart === 'function') {
            console.log('调用 initializeStoreAllocationChart...');
            setTimeout(() => {
                window.initializeStoreAllocationChart();
                // 已取消自动滚动到门店分配区域
            }, 100);
        } else {
            console.error('❌ initializeStoreAllocationChart 函数不存在！');
        }
    } else {
        console.log('❌ 条件不满足，隐藏门店分配');
        console.log('  - 所有车型有目标?', allVehiclesHaveTargets);
        console.log('  - 车型数量 > 0?', vehicles.length > 0);
        console.log('  - 已选择区域?', !!state.selectedRegion);

        // 有车型没有设置目标，或未选择区域，隐藏门店分配区域
        storeAllocationSection.classList.add('hidden');
    }
}


// ============== 全局函数导出（供HTML onclick调用）==============
// Note: window.switchVehicle 已在上方导出，demo-chart.js 会 hook 它
window.confirmClearStock = confirmClearStock;
window.confirmAddVehicle = confirmAddVehicle;

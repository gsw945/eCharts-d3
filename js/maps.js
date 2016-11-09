var typeName = "android";
var str = '';
var top10 = [], data = [], geoCoordMap = {}, province_data = [], city_data = [];
var angel = [], members = [], dot_geo = {}, convert = [], xq = [], success_rate = [], dataXQ = [], dataDT = [];
var unit_id, xiaoqu_name, total_counts, avg_sigal, xiaoqu, signal, open_status, network, open_door, city_code, city_name, province, pl, cl, base_size, factor;
var z = 1, j = 1, lat = 0, lng = 0, s_counts = 9501, f_counts = 499, t0 = 0;
var count_base = 15000, signal_base = -90, a = 36, r = 1.2, success_counts = 0, fail_counts = 0, success_base = 95;

$(function(){
    getUnitArea();
    angels_division(a);
    var kmjg;
    var interval01 = setInterval(function() {
    var message = [];
    kmjg = (Math.random() * 145 + 800) * 1000;
    var signal = Math.floor(Math.random() * 50 - 120);
    var kmfs = ['1', '2', '3', '4'];
    var kmwl = ['1', '2', '3', '4', '1', '1'];
    var status = ['1', '2', '3', '4', '5', '6', '7', '6', '7', '6', '7', '6', '7', '6', '7', '6', '7'];
    var kmsb = ['苹果 iPhone 7 32GB', '三星 Galaxy S7 Edge 32G', '华为 P9全网通高配版', 'vivo X7 Plus', '苹果 iPhone 6s Plus', 'OPPO R9s全网通', '三星Galaxy C7', '魅族 魅蓝Note3高配版'];
    var rdm1 = Math.floor(Math.random() * xq.length);
    var rdm2 = Math.floor(Math.random() * kmfs.length);
    var rdm3 = Math.floor(Math.random() * kmwl.length);
    var rdm4 = Math.floor(Math.random() * status.length);
    var rdm5 = Math.floor(Math.random() * kmsb.length);
    message = [xq[rdm1], status[rdm4], kmwl[rdm3], signal, kmfs[rdm2], kmsb[rdm5]];
    onMessages(message);
  }, kmjg);

    //test() not working? everytime I run this app I want some random data for testing.
    //test();
})

function getUnitArea(){
    $.ajax({
        url: 'location.json',
        dataType:'json',
        success: function(result){
        	//获取基础数据，小区id,小区名称等

            for(var i=0, n=result.length; i<n; i++) {
                unit_id = result[i].unit_id;
                xiaoqu_name = result[i].name;
                city_code = result[i].city_code;
                city_name = result[i].city_name;
                province = result[i].province;
                lat = Number(result[i].lat);
                lng = Number(result[i].lng);
                //各种创建数组，就是为了实现有数据传入时在地图打圈圈的功能
                xq.push(unit_id);
                pl = province_data.length;
                cl = city_data.length;
                create_xiaoqu(unit_id, xiaoqu_name, lat, lng, city_code, city_name, province);     
                create_province(lat, lng, province, total_counts, avg_sigal, pl);
                create_city(lat, lng, city_name, province, total_counts, avg_sigal, cl);
                create_dots(lat, lng, unit_id);
            }
            //然后加载百度echarts图表，其他图表在有数据传输过来时才生成
            loadEChart(data, geoCoordMap);
        },
        error: function(){
            alert("加载数据异常！");
        }
    });
}

function angels_division(a) {
	if(a > 0){
		for(var i=0; i<a; i++) {
			var jiaodu = (1 + i) * 360/a;
			angel.push(jiaodu);
		}
	}
}

//返回的数据结构[{name:'unit_id',value:[lat, lng, total_counts, avg_signal]},...] 无论如何请一定记住value数组的前两个位置一定是放经纬度的，不然地图上无法展示数据
function convertData(data, geoCoordMap) {
    var res = [];
    for(var i=0; i<data.length; i++) {
        var geoCoord = geoCoordMap[data[i].name];
         if (geoCoord) {
            res.push({
                name: data[i].name,
                value: geoCoord.concat(data[i].value)
            });
        }
    }
    return res;
}

//创建小区数组，随机生成total_counts和avg_signal作为测试用的~
function create_xiaoqu(unit_id, xiaoqu_name, lat, lng, city_code, city_name, province) {
    //var rdm01 = (Math.random() * 8 + 2) / 10;
    var rdm01 = 1;
    var rdm02 = (Math.random() * 7 + 7) / 10;
    total_counts = count_base * rdm01;
    avg_sigal = signal_base * rdm02;
    xiaoqu = {name: unit_id, value: [total_counts, avg_sigal]};
    data.push(xiaoqu);
    geoCoordMap[unit_id] = [lat, lng, xiaoqu_name, province, city_name, city_code];
    //试图创建另外一个数组用于存放小区id及其对应的开门成功和失败次数，然而并没有成功，总是出现undefined so sad
    var openCounts = {name: unit_id, value: [s_counts, f_counts]};
    success_rate.push(openCounts);
}

//创建省份数组 for循环时要避免多次重复放入数据，因此引入p变量
function create_province(lat, lng, province, total_counts, avg_sigal, pl) {
	var p = 0; 
	for(var i=0; i<pl; i++) {
		//有则改之，无则加勉
		if(province == province_data[i].name) {
            //如果数组中存在该省份，除了修改改省份对应的数据，还需修改p变量，这样就不会重复执行将省份放入数组中
			p = 1;
			var old_counts = province_data[i].value[3];
			var old_signal = province_data[i].value[4];
			province_data[i].value[3] = old_counts + total_counts;
			province_data[i].value[4] = (old_signal + avg_sigal)/2;
			province_data[i].value[5] += 1;
		}
	}
	if(p == 0 || pl == 0) {
		var p_new = {name: province, value: [lat, lng, province, total_counts, avg_sigal, j]};
    	province_data.push(p_new);
	}
}

//创建市区数组
function create_city(lat, lng, city_name, province, total_counts, avg_sigal, cl) {
	var c = 0;
	for(var i=0; i<cl; i++) {
		//有则改之，无则加勉
		if(city_name == city_data[i].name) {
			c = 1;
			var old_counts = city_data[i].value[4];
			var old_signal = city_data[i].value[5];
			city_data[i].value[4] = old_counts + total_counts;
			city_data[i].value[5] = (old_signal + avg_sigal)/2;
			city_data[i].value[6] += 1;
		}
	}
	if(c == 0 || cl == 0) {
		var c_new = {name: city_name, value: [lat, lng, city_name, province, total_counts, avg_sigal, j]};
    	city_data.push(c_new);
	}
}

//每创建一个小区，就以该小区为中心，以r为半径，等角创建原点，主要是方便后续这些点跟原点连接，创建一种由这些点向原点移动的效果
function create_dots(lat, lng, unit_id) {
	var XQData = [];
	var n = angel.length;
	for(var i=0, n=angel.length; i<n; i++) {
		var idx = unit_id + 'dot0' + i;
		var dot = [(lat + r * Math.cos(angel[i] * Math.PI/180)), (lng + r * Math.sin(angel[i] * Math.PI/180))];
		dot_geo[idx] = dot;
		//var xqdata = [{name: idx}, {name: unit_id, value: 1}];
		var xqdata = [{name: unit_id}, {name: idx, value: 1}];
		XQData.push(xqdata);
	}
	var member = [unit_id, XQData];
	members.push(member);
}

//使用 websocket 实现实时数据更新
// var webSocket = new WebSocket();  
// webSocket.onerror = function(event) {
//     onError(event);
//   };
// webSocket.onopen = function(event) {
//     onOpen(event);
//   };
// webSocket.onmessage = function(event) {
//     onMessage(event);
//     t0 = new Date().getTime();
//   };

function onMessages(arr) {
  //获取数据
  //var arr = event.data.split("^^");
  unit_id = arr[0];
  open_status = arr[1];
  signal = arr[3];
  network = arr[2];
  open_door = arr[4];
  DT = arr[5];
  //若设备不存在列表中则将开门设备放入dataDT数组
  var n = dataDT.length;
  var c = 0;
  for(var i=0; i<n; i++){
      if (DT == dataDT[i]) {
    	  c = 1;
      }
  }
  if(n == 0 || c == 0) {
	  dataDT.push(DT);
  }
  //data 的格式：data:[{name:'unit_id', value:[total_counts. avg_signal]},...]
  for(var i=0, n=data.length; i<n; i++) {
      var nvalue = data[i].name;
      var cvalue = data[i].value[0];
      var svalue = data[i].value[1];
      if(unit_id == nvalue) {
          //该小区的total_counts+1,重新计算平均信号
          data[i].value[0] += 1;
          data[i].value[1] = ((cvalue * svalue) + signal)/data[i].value[0];
          //获取小区的经纬度，小区名称， 所在省份
          lat = geoCoordMap[unit_id][0];
          lng = geoCoordMap[unit_id][1];
          xiaoqu_name = geoCoordMap[unit_id][2];
          province = geoCoordMap[unit_id][3];
          //将小区按省分类，方便在地图上展示每个省的小区概况
          for(var j=0, m=province_data.length; j<m; j++) {
              if(province == province_data[j].name) {
                  var old_signal = province_data[j].value[4];
                  province_data[j].value[3] += 1;
                  province_data[j].value[4] = (old_signal + data[j].value[1])/2;
              }
          }
          //当有数据传进来时动态展示，这就是你要的可视化~
          line_effect(unit_id);
          re_loadEChart(unit_id, xiaoqu_name, open_status, signal, network, open_door, DT, z);
          //display_data();
          if(z == 1) {
              loadGauge();
              loadParallel();
          }
      }
  }
  z++;
}

function onOpen(event) {
    //alert("Connection established")
      /*document.getElementById('messages').innerHTML
      = 'Connection established';*/
}

function onError(event) {
    alert(event.data);
}

function start() {
    webSocket.send('hello');
    return false;
}

function convertData02(data, dot_geo) {
	var res = [];
    for (var i = 0; i < data.length; i++) {
        var dataItem = data[i];
//        var fromCoord = dot_geo[dataItem[0].name];
//        var toCoord = geoCoordMap[dataItem[1].name].slice(0,2);
        var fromCoord = geoCoordMap[dataItem[0].name].slice(0,2);
        var toCoord = dot_geo[dataItem[1].name];
        if (fromCoord && toCoord) {
            res.push({
                fromName: dataItem[0].name,
                toName: dataItem[1].name,
                coords: [fromCoord, toCoord]
            });
        }
    }
    return res;
}
//没有数据产生时convert为空，有数据产生后，convert不为空，在loadEchart()函数中固定时间检查一次，若检查到convert不为空，则更改series并重新加载图表
function line_effect(unit_id) {
    for(var i=0, n=members.length; i<n; i++) {
        if(members[i][0] == unit_id) {
            var xqdata = members[i][1];
            convert = convertData02(xqdata, dot_geo);
        }
    }
}

function getNowFormatDate(){
  var nowTime = new Date().getYear();
  return nowTime;
}

//生成展示数据的表格并在前端展示
function re_loadEChart(unit_id, xiaoqu_name, open_status, signal, network, open_door, DT, z) {
	//var table02_head = '<table style="width:100%; color:#1E90FF" id="display-detail-data"><caption>智能小区实时开门数据</caption><tr class="tr1" style="color:#1E90FF"><td style="width:23%; word-wrap: break-word;">小区名称</td><td>开门时间</td><td>信号强度</td><td>开门方式</td><td style="width:26%; word-wrap: break-word;">开门设备</td><td>网络状态</td><td>开门状态</td></tr>';
    var table02_head = '<table style="width:100%; color:#1E90FF" id="display-detail-data"><tr class="tr1" style="color:#1E90FF"><td style="width:13%; word-wrap: break-word;">小区名称</td><td>开门时间</td><td>信号强度</td><td>开门方式</td><td style="width:26%; word-wrap: break-word;">开门设备</td><td>网络状态</td><td>开门状态</td></tr>';
    var table_foot = '</table>';
    if(network === '1') {
		network = "wifi"
	} else {
		network = "蓝牙"
	}
    switch(open_door){
    case '1':
    	open_door = "一键开门";
    	break;
    case '2':
    	open_door = "自动开门";
    	break;
    case '3':
    	open_door = "亮屏开门";
    	break;
    case '4':
    	open_door = "摇一摇";
    	break;
    }
	if(open_status === '6' || open_status === '7') {
		  open_status = '成功';
		  //<img src="http://i.niupic.com/images/2016/10/27/xrwMjL.jpg">
		  str = '<tr class="success"><td>'+xiaoqu_name+'</td><td>'+getNowFormatDate()+'</td><td>'+signal+'</td><td>'+open_door+'</td><td>'+DT+'</td><td>'+network+'</td><td>'+"成功！"+'</td></tr>'+str;
		  success_counts += 1;
		  for(var i=0, n=success_rate.length; i<n; i++){
			  if(unit_id == success_rate[i].name) {
				  success_rate[i].value[0] += 1;
			  }
		  }
	}
	else {
		  open_status = '失败';
		  //<img src="http://i.niupic.com/images/2016/10/27/xrwMjL.jpg">
		  str = '<tr class="fail"><td>'+xiaoqu_name+'</td><td>'+getNowFormatDate()+'</td><td>'+signal+'</td><td>'+open_door+'</td><td>'+DT+'</td><td>'+network+'</td><td>'+"失败！"+'</td></tr>'+str;
		  fail_counts += 1;
		  for(var i=0, n=success_rate.length; i<n; i++){
			  if(unit_id == success_rate[i].name) {
				  success_rate[i].value[1] += 1;
			  }
		  }
	}
      //将开门数据放入数组 dataXQ的格式 dataXQ = {[1,-55,"wifi","摇一摇","XIAOMI#MUI4",1],...}
      var elmt = [z, signal, network, open_door, DT, open_status];
      dataXQ.push(elmt);
	  $("#chart02").html("");
	  $("#chart02").html(table02_head+str+table_foot);
	  var failClass = document.getElementsByClassName("fail");
	  var successClass = document.getElementsByClassName("success");
	  for(var i=0, n=failClass.length; i<n; i++) {
		  failClass[i].style.color = "#fc9272";
	  }
	  for(var i=0, n=successClass.length; i<n; i++) {
		  successClass[i].style.color = "#99d8c9";
	  }
}

//同样生成展示前10名的表格并在前端展示
function display_data() {
	var str = '';
    var table_foot = '</table>';
    var table01_head = '<table style="width:100%; color:#1E90FF" id="display-sum-data"><caption>智能小区开门总次数排行榜</caption><tr><th style="width:40%; word-wrap: break-word;">小区名称</th><th>累计开门次数</th><th>平均信号强度</th></tr>'; //<th>开门成功率</th>
	var s_rate, s, f;
	top10 = data.sort(function(a,b) {
		return b.value[0] - a.value[0];
	}).slice(0,10);
	for(var i=0, n=top10.length; i<n; i++) {
		xiaoqu_name = geoCoordMap[top10[i].name][2];
		total_counts = Math.round(top10[i].value[0]);
		avg_signal = Math.round(top10[i].value[1]*100)/100;
		for(var j=0, m=success_rate.length; j<m; j++) {
			if(top10[i].name === success_rate[j].name) {
				s = success_rate[j].value[0];
				f = success_rate[j].value[1];
				s_rate = Math.round(s/(s+f)*10000)/100;
				console.log(s_rate);
			}
		}
		str += '<tr style="text-color:green"><td><img src="http://i.niupic.com/images/2016/10/27/69DOKk.jpg">'+xiaoqu_name+'</td><td>'+total_counts+'</td><td>'+avg_signal+'</td></tr>'; //<td>'+s_rate+'%'+'</td>
	}
	$("#chart01").html("");
	$("#chart01").html(table01_head+str+table_foot);
}

function loadEChart(data, geoCoordMap) {
	//使用echarts3.0版本的做法
    var dom = document.getElementById("main");
    var myChart = echarts.init(dom);
    //使用effectScatter展示各个省份的数据，后面重新加载图表的时候也没有更改这种类型
    var series = [];
    var app = {};
    option = null;
	series.push(
        {
            name: 'xiqoqu',
            type: 'effectScatter',
            //本来是打算用bmap的，因为有集成百度地图的API，具备百度地图所具备的功能
            coordinateSystem: 'geo',
            //刚开始展示的是省份的数据
            data:province_data,
            //因为省份累计整个省的小区数，所以total_counts会很大，因此factor不同，分三个判断条件判断传来的数组是省份的，还是市区的，还是小区的
            symbolSize: function (val) {
            	var m = convertData(data, geoCoordMap).length;
            	if(val.length == 6) {
            		base_size = 10;
            		if(m < 500){
            			factor = count_base * 1.8;
            		}
            		if(m >= 500 && m < 1000 ){
            			factor = count_base * 3.5;
            		}
            		if(m >= 1000){
            			factor = count_base * 4.5;
            		}
            		return base_size + val[3] / factor;
            	} else if(val.length == 7) {
            		base_size = 8;
            		if(m < 500){
            			factor = count_base * 1.6;
            		}
            		if(m >= 500 && m < 1000 ){
            			factor = count_base * 3.0;
            		}
            		if(m >= 1000){
            			factor = count_base * 4.5;
            		}
            		return base_size + val[4] / factor;
            	}
            	else {
            		factor = count_base * 4;
            		if(m > 200 && m < 400){
            			base_size = 7.5;
            		}
            		if(m >= 400 && m < 650) {
            			base_size = 5;
            		}
            		if(m >= 650){
            			base_size = 3.5;
            		}
            		return base_size + val[6] / factor;
            	}
            },    
            showEffectOn: 'render',
            rippleEffect: {
                //brushType: ''
            	brushType: 'stroke'
            },
            hoverAnimation: true,
            itemStyle: {
                normal: {
                    color: '#f7f7f7',
                    shadowBlur: 10,
                    shadowColor: '#333',
                    opacity: 0.6
                }
            },
            zlevel: 1
        }
	);
    option = {
      backgroundColor: '#000000',
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicInOut',
      animationDurationUpdate: 1000,
      animationEasingUpdate: 'cubicInOut',
      geo: {
    		center:[110.601265,33.02564],
            map: 'china',
            zoom: 1.2,
            roam: true,
            itemStyle: {
                normal: {
                    areaColor: '#000000',
                    borderColor: '#1E90FF'
                },
                emphasis: {
                    areaColor: '#FFFAFA',
                    opacity: 0.2
                }
            },
            label: {
                normal:{
                  show:true,
                  textStyle:{
                      color:'#1E90FF'
                  }     
                },
                emphasis: {
                    show: true
                }
            },
        },
        //tooltip的判断条件也是判断传来的数组是省份的还是市区的还是小区的，然后设置不同的tooltip
        tooltip : {
        	triggerOn: 'mousemove',
            padding: 10,
            backgroundColor: '#222',
            borderColor: '#777',
            borderWidth: 1,
            formatter: function (obj) {
                var name = obj.name;
                var value = obj.value;
                var mingchen = value[2];
                var tip = '';
                var kaimen, xinhao, stat, txt;
                if(value.length == 6) {
                	tip = '省份:';
                	stat = value[5];
                	kaimen = Math.round(value[3]);
                	xinhao = Math.round(value[4]);
                	txt = '小区数量';
                } 
                else if(value.length == 7) {
                	tip = '市区:';
                	stat = value[6];
                	kaimen = Math.round(value[4]);
                	xinhao = Math.round(value[5]);
                	txt = '小区数量';
                }
                else {
                	tip = '小区:';
                	stat = value[3] + ' ' + value[4];
                	kaimen = Math.round(value[6]);
                	xinhao = Math.round(value[7]);
                	txt = '所在地区';
                }
                return '<div style="border-bottom: 1px solid rgba(255,255,255,.3); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">'
                    + tip + ' ' + mingchen
                    + '</div>'
                    + txt + '：' + stat + '<br>'
                    + '累计开门次数' + '：' + kaimen + '<br>'
                    + '平均信号强度' + '：' + xinhao + '<br>';
            }
        },
        //其实前面不用push直接把对象放在这里也是可以的吧
        series : series
    };

    //当没有数据时，convert变为空，checking中的if函数中的内容就不会执行，也就不会每过一段时间就把opening push到series
    var setNull = setInterval(function() {
        convert = {};
    }, 5000) 

	//打圈圈和转圈圈，设置检测时间为1秒钟。
    var checking = setInterval(function() {
        //每隔一段时间检查一下当前时间，然后跟前一次有数据进来时记录的时间做比较，若时间差超出一定范围，也即很长时间没有数据发送过来，则将convert清空
        var t1 = new Date().getTime();
        if(t0 > 0) {
            if((t1 - t0) > 20000) {
                convert = {};
            }
        }
    	//重置数据
		series[0].data = convertData(data, geoCoordMap);
		//随机选择一种颜色
		var color = ['#fff7bc', '#fec44f', '#d95f0e', '#f03b20', '#dd1c77', 'yellow', 'yellow']
		var i = Math.floor(Math.random() * 6);
	    var opening = {
	        type: 'lines',
	        zlevel: 1,
	        effect: {
	            show: true,
	            period: 1.8,
	            //constantSpeed:200,
	            trailLength: 0,
	            //symbol: planePath,
	            //symbolSize: 1
	        },
	        lineStyle: {
	            normal: {
	                color: color[i],
	                width: 1,
	                opacity: 0.1,
	                //curveness: 0.3
	            }
	        },
	        data: convert
	    };
	    if($.isEmptyObject(convert) != true) {
	    	series.push(opening)
			myChart.setOption({
                //当有数据产生时将地图放大并将中心移动到指定位置
				geo: {
					center:[110.601265,25.02564],
					zoom:2.0,
					roam: true,
				},
				//给离散化数据进行分组
				visualMap: {
//					min: -120,
//			        max: -60,
//			        splitNumber: 3,
//			        inRange: {
//			            color: ['#fc8d59','#ffffbf','#91cf60'].reverse()
//			        },
//			        textStyle: {
//			            color: '#fff'
//			        }
		            top: 30,
		            right: 20,
		            textStyle: {
		                color: '#ffffff',
		                fontWeight: 'bolder',
			            fontSize: 15,
		            },
		            pieces: [{
		                gt: -130,
		                lte: -100,
		                color: '#fc8d59'
		            }, {
		                gt: -100,
		                lte: -80,
		                color: '#ffffbf'
		            }, {
		                gt: -80,
		                lte: -60,
		                color: '#91cf60'
		            }],
		            outOfRange: {
		                color: 'red'
		            }
		        },
				series: series
			});
	    }
        if(series.length > 1) {
            series = series.slice(0,1);
        }
    }, 2000)
    
    //双击和单击对应不同事件
	$("#main").dblclick(function() {
		clearInterval(checking);
        if(series.length > 1) {
            series = series.slice(0,1);
        }
		myChart.setOption({
			geo: {
	    		//center:[110.601265,33.02564],
	            //map: 'china',
	            zoom: 1.2,
	            roam: true,
//	            itemStyle: {
//	                normal: {
//	                    areaColor: '#000000',
//	                    borderColor: '#1E90FF'
//	                },
//	                emphasis: {
//	                    areaColor: '#FFFAFA',
//	                    opacity: 0.2
//	                }
//	            }
	        },	
		    visualMap: {
		    	show:false,
		    },    
		    series: [{
			    	data: province_data,
			    	rippleEffect: {
	                    //brushType: ''
	                	brushType: 'stroke'
	                },
	                itemStyle: {
	                    normal: {
	                        color: '#f7f7f7',
	                        shadowBlur: 10,
	                        shadowColor: '#333',
	                        opacity: 0.6
	                    }
	                }
			    }]
		})
	});
	$("#main").toggle(function() {
		myChart.setOption({
			visualMap: {
				show:false,
	            top: 30,
	            right: 20,
	            textStyle: {
	                color: '#ffffff',
	                fontWeight: 'bolder',
		            fontSize: 15,
	            },
	            pieces: [{
	                gt: -130,
	                lte: -100,
	                color: '#fc8d59'
	            }, {
	                gt: -100,
	                lte: -80,
	                color: '#ffffbf'
	            }, {
	                gt: -80,
	                lte: -60,
	                color: '#91cf60'
	            }],
	            outOfRange: {
	                color: 'red'
	            }
	        },
		    series: [{
			    	data: city_data,
			    	rippleEffect: {
	                	brushType: 'stroke'
	                },
			    }]
		})
	}, function() {
		myChart.setOption({
	        visualMap: {
		    	show:true,
		    }, 
		    series: [{
		    	data: convertData(data, geoCoordMap),
		    	rippleEffect: {
		    			brushType: 'stroke'
	                },
			    }]
		})
	});
    
    if (option && typeof option === "object") {
        myChart.setOption(option, true);
    }   
}

//加载一个仪表盘，用来表示开门成功率
function loadGauge() {
	var dom = document.getElementById("chart00");
	var myChart_gauge = echarts.init(dom);
	var app = {};
	option_gauge = null;
	option_gauge = {
		//backgroundColor: 'rgba(30,144,255,.23)',
	    series: [
			{
			    name:'开门指标',
			    type:'gauge',
			    min:50,
			    max:100,
			    bottom:20,
			    splitNumber:10,
			    radius: '90%',
			    axisLine: {            // 坐标轴线
			        lineStyle: {       // 属性lineStyle控制线条样式
			            color: [[0.09, 'red'],[0.82, '#1e90ff'],[1, 'green']],
			            width: 3,
			            shadowColor : '#fff', 
			            shadowBlur: 10
			        }
			    },
			    axisLabel: {            // 坐标轴小标记
			        textStyle: {       // 属性lineStyle控制线条样式
			            fontWeight: 'bolder',
			            color: '#fff',
			            shadowColor : '#fff', 
			            shadowBlur: 15
			        }
			    },
			    axisTick: {            // 坐标轴小标记
			        length :8,        // 属性length控制线长
			        lineStyle: {       // 属性lineStyle控制线条样式
			            color: 'auto',
			            shadowColor : '#fff', 
			            shadowBlur: 10
			        }
			    },
			    splitLine: {           // 分隔线
			        length :8,         // 属性length控制线长
			        lineStyle: {       
			            width:3,
			            color: '#fff',
			            shadowColor : '#fff', 
			            shadowBlur: 10
			        }
			    },
			    pointer: {           // 分隔线
			        shadowColor : '#fff', 
			        shadowBlur: 5
			    },
			    title : {
			        textStyle: {       
			            fontWeight: 'bolder',
			            fontSize: 10,
			            fontStyle: 'italic',
			            color: '#fff',
			            shadowColor : '#fff', //默认透明
			            shadowBlur: 10
			        }
			    },
			    detail : {
			        //backgroundColor: 'rgba(30,144,255,0.8)',
			        //borderWidth: 1,
			    	formatter:'{value}%',
			        borderColor: '#fff',
			        shadowColor : '#fff', 
			        shadowBlur: 5,
			        offsetCenter: [0, '50%'],       // x, y，单位px
			        textStyle: {       
			            fontWeight: 'bolder',
			            color: '#a1d99b',
			            fontSize:16
			        }
			    },
			    data:[{value: success_base, name: '开门成功率'}]
			},
	    ]
	};

	app.timeTicket = setInterval(function () {
		//计算开门成功率并重新加载仪表盘
		if(success_counts == 0 && fail_counts == 0) {
			success_rate = success_base;
		} else {
			success_rate = Math.round(success_counts/(success_counts + fail_counts) * 100);
		}
		option_gauge.series[0].data[0].value = success_rate;
	    myChart_gauge.setOption(option_gauge, true);
	},2000);
		
	if (option_gauge && typeof option_gauge === "object") {
	    myChart_gauge.setOption(option_gauge, true);
	}
}

//加载平行坐标轴，信号，网络，开门方式，开门设备等决定了开门是否成功
function loadParallel() {
	var dom = document.getElementById("chart01");
	var myChart_parallel = echarts.init(dom);
	var app = {};
	option_parallel = null;
    var schema = [
        {name: 'id', index: 0, text: '开门次数'},
        {name: 'signal', index: 1, text: '信号'},
        {name: 'network', index: 2, text: '网络'},
        {name: 'way', index: 3, text: '方式'},
        {name: 'DT', index: 4, text: '设备'},
        {name: 'status', index: 5, text: '状态'}
   ];
    var lineStyle = {
        normal: {
            color: '#1E90FF',
            width: 0.5,
            opacity: 0.18
//            	function(){
//            	if (dataXQ.length > 200){
//            		return 0.2
//            	} else {
//            		return 0.9
//            	}
//            }
        }
    };
	option_parallel = {
	    backgroundColor: 'rgba(30,144,255,.23)',
        parallelAxis: [
            {dim: 0, name: schema[0].text, min:1, inverse: true, nameLocation: 'start'},
            {dim: 1, name: schema[1].text, min:-120, max:-70},  
            {dim: 2, name: schema[2].text, type: 'category', data: ["wifi", "蓝牙"]},
            {dim: 3, name: schema[3].text, type: 'category', data: ["摇一摇", "一键开门", "自动开门", "亮屏开门"]},
            {dim: 4, name: schema[4].text, type: 'category', data: dataDT},
            //{dim: 5, name: schema[5].text, type: 'category', data: ["1", "2","3","4","5","6","7"]}
            {dim: 5, name: schema[5].text, type: 'category', data: ["失败", "成功"]}
        ],
//         visualMap: {
//             show: false,
//             min: 1,
//             max: 7,
//             //dimension: 2,
//             //categories: ["失败", "成功"],
//             inRange: {
//                 color: ['red','green'],
//                 // colorAlpha: [0, 1]
//             }
//         },
	    parallel: {
	    	 top: '33.0',
	         left: 20,
	         right: 30,
	         bottom: 15,
            //axisExpandable: true,
            //axisExpandCenter: 15,
            //axisExpandCount: 4,
            //axisExpandWidth: 100,
	        parallelAxisDefault: {
	            type: 'value',
	            //name: 'AQI指数',
	            nameLocation: 'end',
	            //nameGap: 20,
	            //splitNumber: 1,
	            nameTextStyle: {
	                color: '#1E90FF',
	                fontSize: 10
	            },
	            axisLine: {
	                lineStyle: {
	                    color: '#1E90FF'
	                }
	            },
	            axisTick: {
	                lineStyle: {
	                    color: '#1E90FF'
	                }
	            },
	            splitLine: {
	                show: true
	            },
	            axisLabel: {
	                textStyle: {
	                    color: '#ffffff',
	                    fontSize: 9
	                }
	            }
	        }
	    },
	    series: [
	        {
	            name: 'XIAOQU',
	            type: 'parallel',
                smooth: true,
                blendMode: 'lighter',
	            lineStyle: lineStyle,
	            data: dataXQ
	        }
	    ]
	};
	
	app.timeTicket = setInterval(function () {
		//每隔一段时间检查数据是否更新，并更新图表
		option_parallel.parallelAxis[4].data = dataDT;
		option_parallel.series[0].data = dataXQ;
		myChart_parallel.setOption(option_parallel, true);
	},50);
	
	if (option_parallel && typeof option_parallel === "object") {
	    myChart_parallel.setOption(option_parallel, true);
	}
}

function test() {
	//小区id集合，开门时间间隔，开门状态，网络状态，开门方式，开门设备
	var myDate = new Date();
	var kmjg = Math.random() * 20;
	var kmfs = ['一键开门', '摇一摇', '亮屏开门', '自动开门'];
	var kmwl = ['蓝牙', 'wifi'];
	var status = [1, 2, 3, 4, 5, 6, 7];
	var kmsb = ['苹果 iPhone 7 32GB', '三星 Galaxy S7 Edge 32G', '华为 P9全网通高配版', 'vivo X7 Plus', '苹果 iPhone 6s Plus', 'OPPO R9s全网通', '三星Galaxy C7', '魅族 魅蓝Note3高配版'];
	var collection =[];
	for(var i=0; i<xq.length; i++){
		for(var j=0; j<kmfs.length; j++){
			for(var k=0; k<kmwl.length; k++){
				for(var l=0; l<status.length; l++){
					for(var x=0; x<kmsb.length; x++){
						var km = 'http://192.168.0.235:7890/log/put?' + 'UNIT_ID=' + xq[i] + '&'+ 'OPEN_DOOR=' + kmfs[j] + '&' + 'NETWORK=' + kmwl[k] + '&' + 'OPEN_STATUS=' + status[l] + '&' + 'DT=' + kmsb[x];
						collection.push(km);
					}
				}
			}
		}
	}
	var idx01 = Math.floor(Math.random() * collection.length);
	var idx02 = Math.floor(Math.random() * collection.length);
	var idx03 = Math.floor(Math.random() * collection.length);
  var idx04 = Math.floor(Math.random() * collection.length);
  var idx05 = Math.floor(Math.random() * collection.length);
  var idx06 = Math.floor(Math.random() * collection.length);
	var w1 = window.open(collection[idx01], 'w1');
	var w2 = window.open(collection[idx02], 'w2');
	var w3 = window.open(collection[idx03], 'w3');
  var w4 = window.open(collection[idx04], 'w4');
  var w5 = window.open(collection[idx05], 'w5');    
	var testInterval = setInterval(function(){
	idx01 = Math.floor(Math.random() * collection.length);
	idx02 = Math.floor(Math.random() * collection.length);
	idx03 = Math.floor(Math.random() * collection.length);
	w1.location.replace(collection[idx01]);
	w2.location.replace(collection[idx02]);
	w3.location.replace(collection[idx03]);
	kmjg = Math.random() * 20;
	}, kmjg*1000)
}
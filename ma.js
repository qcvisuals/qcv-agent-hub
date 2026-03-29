Chart.defaults.color="#888";
Chart.defaults.borderColor="#2a2a2a";
var charts={};
function destroyCharts(){Object.values(charts).forEach(function(c){if(c)c.destroy();});charts={};}
function fmtPrice(v){return v>=1000000?"$"+(v/1000000).toFixed(2)+"M":"$"+Math.round(v).toLocaleString();}
function fmtPct(v){return(v>=0?"+":"")+v.toFixed(1)+"%";}
function showError(msg){var el=document.getElementById("errorBox");el.textContent=msg;el.style.display="block";}
function hideError(){document.getElementById("errorBox").style.display="none";}
function hideDashboard(){document.getElementById("dashboard").style.display="none";}
function setLoading(on){document.getElementById("loading").style.display=on?"block":"none";document.getElementById("searchBtn").disabled=on;}
function getDemoData(zip){
  var base=380000+(parseInt(zip)%300)*800;
  var months=[];var now=new Date();
  for(var i=11;i>=0;i--){var d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push(d.toISOString().slice(0,7));}
  var hist={};
  months.forEach(function(m,i){hist[m]={medianPrice:Math.round(base*(1+i*0.006+(Math.random()-0.5)*0.02)),medianDaysOnMarket:Math.round(18-i*0.4+(Math.random()-0.5)*4)};});
  return{saleData:{lastUpdatedDate:new Date().toISOString(),medianPrice:base,averagePrice:Math.round(base*1.08),minPrice:Math.round(base*0.45),maxPrice:Math.round(base*2.4),medianPricePerSquareFoot:Math.round(base/1800),medianDaysOnMarket:17,totalListings:148,newListings:31,history:hist,
    dataByBedrooms:[
      {bedrooms:1,medianPrice:Math.round(base*0.52),medianPricePerSquareFoot:Math.round(base/1100),medianDaysOnMarket:12,totalListings:18},
      {bedrooms:2,medianPrice:Math.round(base*0.78),medianPricePerSquareFoot:Math.round(base/1400),medianDaysOnMarket:15,totalListings:34},
      {bedrooms:3,medianPrice:base,medianPricePerSquareFoot:Math.round(base/1800),medianDaysOnMarket:17,totalListings:52},
      {bedrooms:4,medianPrice:Math.round(base*1.38),medianPricePerSquareFoot:Math.round(base/2100),medianDaysOnMarket:21,totalListings:30},
      {bedrooms:5,medianPrice:Math.round(base*1.85),medianPricePerSquareFoot:Math.round(base/2600),medianDaysOnMarket:28,totalListings:14}
    ],
    dataByPropertyType:[{propertyType:"Single Family",totalListings:84},{propertyType:"Condo",totalListings:38},{propertyType:"Townhouse",totalListings:22},{propertyType:"Multi-Family",totalListings:4}]
  }};
}
function renderDashboard(data,zip,addr){
  destroyCharts();
  var sale=data.saleData;
  if(!sale){showError("No data for ZIP "+zip);return;}
  var title=addr?addr+", "+zip:"ZIP "+zip;
  document.getElementById("zipDisplay").textContent=title;
  var upd=new Date(sale.lastUpdatedDate);
  document.getElementById("lastUpdated").textContent="Updated "+upd.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
  document.getElementById("kpiMedianPrice").textContent=fmtPrice(sale.medianPrice);
  document.getElementById("kpiAvgPrice").textContent="Avg: "+fmtPrice(sale.averagePrice);
  document.getElementById("kpiPricePerSqft").textContent="$"+Math.round(sale.medianPricePerSquareFoot);
  document.getElementById("kpiDOM").textContent=Math.round(sale.medianDaysOnMarket);
  document.getElementById("kpiTotal").textContent=(sale.totalListings||0).toLocaleString();
  document.getElementById("kpiNew").textContent=(sale.newListings||0)+" new this month";
  document.getElementById("kpiMin").textContent=fmtPrice(sale.minPrice);
  document.getElementById("kpiMax").textContent="Max: "+fmtPrice(sale.maxPrice);
  if(sale.history){var mos=Object.keys(sale.history).sort();if(mos.length>=2){var old=sale.history[mos[0]].medianPrice;var delta=((sale.medianPrice-old)/old)*100;var el=document.getElementById("kpiPriceDelta");el.textContent=fmtPct(delta)+" vs 12mo ago";el.className="kpi-delta "+(delta>=0?"up":"down");}}
  var dom=sale.medianDaysOnMarket;var hp,hl,hd;
  if(dom<=10){hp=92;hl="Hot Sellers Market";hd="Avg "+Math.round(dom)+" days";}
  else if(dom<=20){hp=75;hl="Strong Sellers Market";hd=Math.round(dom)+" days avg";}
  else if(dom<=35){hp=55;hl="Balanced Market";hd=Math.round(dom)+" days avg";}
  else if(dom<=60){hp=35;hl="Buyers Market";hd="Homes sitting "+Math.round(dom)+" days";}
  else{hp=12;hl="Cold Market";hd=Math.round(dom)+" days avg";}
  document.getElementById("heatIndicator").style.left=hp+"%";
  document.getElementById("heatStatus").textContent=hl;
  document.getElementById("heatDesc").textContent=hd;
  var hm=sale.history?Object.keys(sale.history).sort():[];
  var tl=hm.map(function(m){var d=new Date(m);return d.toLocaleDateString("en-US",{month:"short",year:"2-digit"});});
  var tp=hm.map(function(m){return sale.history[m]?sale.history[m].medianPrice:null;});
  charts.trend=new Chart(document.getElementById("trendChart"),{type:"line",data:{labels:tl,datasets:[{label:"Median Price",data:tp,borderColor:"#e07940",backgroundColor:"rgba(224,121,64,0.08)",borderWidth:2.5,pointBackgroundColor:"#e07940",pointRadius:4,fill:true,tension:0.4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){return" "+fmtPrice(c.parsed.y);}}}},scales:{x:{grid:{color:"#1e1e1e"},ticks:{maxTicksLimit:6}},y:{grid:{color:"#1e1e1e"},ticks:{callback:function(v){return fmtPrice(v);}}}}}});
  var dp=hm.map(function(m){return sale.history[m]?sale.history[m].medianDaysOnMarket:null;});
  charts.dom=new Chart(document.getElementById("domChart"),{type:"bar",data:{labels:tl,datasets:[{label:"DOM",data:dp,backgroundColor:"rgba(224,121,64,0.6)",borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{maxTicksLimit:4,font:{size:10}}},y:{grid:{color:"#1e1e1e"}}}}});
  var bd=(sale.dataByBedrooms||[]).filter(function(d){return d.bedrooms<=5;}).sort(function(a,b){return a.bedrooms-b.bedrooms;});
  charts.bedroom=new Chart(document.getElementById("bedroomChart"),{type:"bar",data:{labels:bd.map(function(d){return d.bedrooms+"BR";}),datasets:[{label:"Median Price",data:bd.map(function(d){return d.medianPrice;}),backgroundColor:["#e07940","#f0914f","#c96830","#b55828","#a04820"],borderRadius:8}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){return" "+fmtPrice(c.parsed.y);}}}},scales:{x:{grid:{display:false}},y:{grid:{color:"#1e1e1e"},ticks:{callback:function(v){return fmtPrice(v);}}}}}});
  var pt=(sale.dataByPropertyType||[]).filter(function(d){return d.totalListings>0;});
  charts.type=new Chart(document.getElementById("typeChart"),{type:"doughnut",data:{labels:pt.map(function(d){return d.propertyType;}),datasets:[{data:pt.map(function(d){return d.totalListings;}),backgroundColor:["#e07940","#4ade80","#60a5fa","#c084fc","#facc15"],borderColor:"#161616",borderWidth:3,hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{padding:12,font:{size:11}}}},cutout:"65%"}});
  charts.sqft=new Chart(document.getElementById("sqftChart"),{type:"bar",data:{labels:bd.map(function(d){return d.bedrooms+"BR";}),datasets:[{label:"sqft",data:bd.map(function(d){return Math.round(d.medianPricePerSquareFoot);}),backgroundColor:"rgba(74,222,128,0.7)",borderRadius:6}]},options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){return" $"+c.parsed.x+"/sqft";}}}},scales:{x:{grid:{color:"#1e1e1e"},ticks:{callback:function(v){return"$"+v;}}},y:{grid:{display:false}}}}});
  var tb=document.getElementById("compBody");tb.innerHTML="";
  bd.forEach(function(d){var dm=Math.round(d.medianDaysOnMarket||0);var pc=dm<=14?"<span class=\"pill hot\">Hot</span>":dm<=30?"<span class=\"pill warm\">Warm</span>":"<span class=\"pill cool\">Slow</span>";tb.innerHTML+="<tr><td><strong>"+d.bedrooms+" BR</strong></td><td>"+fmtPrice(d.medianPrice)+"</td><td>$"+Math.round(d.medianPricePerSquareFoot||0)+"</td><td>"+dm+"d</td><td>"+(d.totalListings||0).toLocaleString()+"</td><td>"+pc+"</td></tr>";});
  document.getElementById("dashboard").style.display="block";
  document.getElementById("emptyState").style.display="none";
}
function runSearch(){
  var zip=document.getElementById("zipInput").value.trim();
  var addr=document.getElementById("addrInput").value.trim();
  if(!/^[0-9]{5}$/.test(zip)){showError("Please enter a valid 5-digit ZIP code.");return;}
  setLoading(true);hideError();hideDashboard();
  var data=getDemoData(zip);
  renderDashboard(data,zip,addr);
  setLoading(false);
}
document.addEventListener("DOMContentLoaded",function(){
  document.getElementById("searchBtn").addEventListener("click",runSearch);
  document.getElementById("zipInput").addEventListener("keydown",function(e){if(e.key==="Enter")runSearch();});
  document.getElementById("addrInput").addEventListener("keydown",function(e){if(e.key==="Enter")runSearch();});
  document.getElementById("zipInput").value="30309";
  runSearch();
});
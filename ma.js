var RC_KEY="810abc2c31fb415386a04e2198a10573";
var charts={};
var currentData=null,currentZip="",currentAddr="",currentCity="";
Chart.defaults.color="#888";
Chart.defaults.borderColor="#2a2a2a";
Chart.defaults.font.family="Segoe UI,system-ui,sans-serif";
function destroyCharts(){Object.values(charts).forEach(function(c){if(c)c.destroy();});charts={};}
function fmtPrice(v){if(!v&&v!==0)return"N/A";return v>=1000000?"$"+(v/1000000).toFixed(2)+"M":"$"+Math.round(v).toLocaleString();}
function fmtNum(v){return v!=null?Math.round(v).toLocaleString():"N/A";}
function fmtPct(v){return(v>=0?"+":"")+v.toFixed(1)+"%";}
function showError(msg){var el=document.getElementById("errorBox");el.textContent=msg;el.style.display="block";}
function hideError(){document.getElementById("errorBox").style.display="none";}
function hideDashboard(){document.getElementById("dashboard").style.display="none";}
function setProgress(pct,label){
  var wrap=document.getElementById("progressWrap");
  wrap.style.display="block";
  document.getElementById("progressBar").style.width=pct+"%";
  document.getElementById("progressLabel").textContent=label;
  if(pct>=100)setTimeout(function(){wrap.style.display="none";},1000);
}
function lookupZip(zip,cb){
  fetch("https://api.zippopotam.us/us/"+zip)
  .then(function(r){return r.ok?r.json():null;})
  .then(function(d){cb(d&&d.places?d.places[0]["place name"]+", "+d.places[0]["state abbreviation"]:null);})
  .catch(function(){cb(null);});
}
function renderDashboard(data,zip,addr,city){
  destroyCharts();
  var sale=data.saleData;
  if(!sale){showError("No market data available for ZIP "+zip);return;}
  currentData=data;currentZip=zip;currentAddr=addr;currentCity=city;
  var title="Market Report";
  if(city)title+=" - "+city;
  if(addr)title=" "+addr+(city?", "+city:"");
  document.getElementById("zipDisplay").textContent=title;
  var upd=new Date(sale.lastUpdatedDate);
  document.getElementById("lastUpdated").textContent="Updated "+upd.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
  if(city){var cb=document.getElementById("cityBadge");cb.textContent=zip+" - "+city;cb.style.display="inline-block";}
  document.getElementById("kpiMedianPrice").textContent=fmtPrice(sale.medianPrice);
  document.getElementById("kpiAvgPrice").textContent="Avg: "+fmtPrice(sale.averagePrice);
  document.getElementById("kpiAvgPriceStat").textContent=fmtPrice(sale.averagePrice);
  document.getElementById("kpiMedianPSF").textContent=sale.medianPricePerSquareFoot?"$"+Math.round(sale.medianPricePerSquareFoot):"N/A";
  document.getElementById("kpiAvgPSF").textContent=sale.averagePricePerSquareFoot?"Avg: $"+Math.round(sale.averagePricePerSquareFoot):"";
  document.getElementById("kpiMin").textContent=fmtPrice(sale.minPrice);
  document.getElementById("kpiMax").textContent="Max: "+fmtPrice(sale.maxPrice);
  if(sale.history){var mos=Object.keys(sale.history).sort();if(mos.length>=2){var old=sale.history[mos[0]].medianPrice;if(old&&sale.medianPrice){var delta=((sale.medianPrice-old)/old)*100;var el=document.getElementById("kpiPriceDelta");el.textContent=fmtPct(delta)+" vs 12mo ago";el.className="kpi-delta "+(delta>=0?"up":"down");}}}
  document.getElementById("kpiMedianDOM").textContent=sale.medianDaysOnMarket!=null?Math.round(sale.medianDaysOnMarket):"N/A";
  document.getElementById("kpiAvgDOM").textContent=sale.averageDaysOnMarket!=null?"Avg: "+Math.round(sale.averageDaysOnMarket)+" days":"";
  document.getElementById("kpiMinDOM").textContent=sale.minDaysOnMarket!=null?sale.minDaysOnMarket+"d min":"N/A";
  document.getElementById("kpiMaxDOM").textContent=sale.maxDaysOnMarket!=null?"Max: "+sale.maxDaysOnMarket+" days":"";
  document.getElementById("kpiTotal").textContent=(sale.totalListings||0).toLocaleString();
  document.getElementById("kpiNew").textContent=(sale.newListings||0)+" new this month";
  document.getElementById("kpiAvgSqft").textContent=sale.averageSquareFootage?fmtNum(sale.averageSquareFootage)+" sqft":"N/A";
  document.getElementById("kpiMedianSqft").textContent=sale.medianSquareFootage?"Median: "+fmtNum(sale.medianSquareFootage)+" sqft":"";
  var dom=sale.medianDaysOnMarket||30;var hp,hl,hd;
  if(dom<=10){hp=92;hl="Hot Sellers Market";hd="Homes moving fast - avg "+Math.round(dom)+" days";}
  else if(dom<=20){hp=75;hl="Strong Sellers Market";hd="Fast-moving - "+Math.round(dom)+" days avg";}
  else if(dom<=35){hp=55;hl="Balanced Market";hd="Moderate pace - "+Math.round(dom)+" days avg";}
  else if(dom<=60){hp=35;hl="Buyers Market";hd="Slower market - homes sitting "+Math.round(dom)+" days";}
  else{hp=12;hl="Cold Market";hd="High supply - "+Math.round(dom)+" days avg";}
  document.getElementById("heatIndicator").style.left=hp+"%";
  document.getElementById("heatStatus").textContent=hl;
  document.getElementById("heatDesc").textContent=hd;
  var newL=sale.newListings||0;var total=sale.totalListings||0;
  var insight="";
  if(dom<=15)insight="Fast market: homes are moving quickly. Well-priced listings are likely to get multiple offers.";
  else if(dom<=25)insight="Active seller conditions. Buyers should be prepared to act quickly on well-priced homes.";
  else if(dom<=45)insight="Balanced market. Both buyers and sellers have reasonable negotiating leverage.";
  else insight="Buyers have leverage. Homes are sitting longer, giving buyers more room to negotiate price and terms.";
  document.getElementById("insightBar").textContent="Market Insight: "+insight;
  document.getElementById("insightBar").style.display="block";
  var hm=sale.history?Object.keys(sale.history).sort():[];
  var tl=hm.map(function(m){var d=new Date(m);return d.toLocaleDateString("en-US",{month:"short",year:"2-digit"});});
  var tp=hm.map(function(m){return sale.history[m]?sale.history[m].medianPrice:null;});
  charts.trend=new Chart(document.getElementById("trendChart"),{type:"line",data:{labels:tl,datasets:[{label:"Median Price",data:tp,borderColor:"#e07940",backgroundColor:"rgba(224,121,64,0.08)",borderWidth:2.5,pointBackgroundColor:"#e07940",pointRadius:4,fill:true,tension:0.4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){return" "+fmtPrice(c.parsed.y);}}}},scales:{x:{grid:{color:"#1e1e1e"},ticks:{maxTicksLimit:6}},y:{grid:{color:"#1e1e1e"},ticks:{callback:function(v){return fmtPrice(v);}}}}}});
  var dp=hm.map(function(m){return sale.history[m]?sale.history[m].medianDaysOnMarket:null;});
  charts.dom=new Chart(document.getElementById("domChart"),{type:"bar",data:{labels:tl,datasets:[{label:"Median DOM",data:dp,backgroundColor:"rgba(224,121,64,0.6)",borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{maxTicksLimit:5,font:{size:10}}},y:{grid:{color:"#1e1e1e"}}}}});
  var bd=(sale.dataByBedrooms||[]).filter(function(d){return d.bedrooms!=null&&d.bedrooms<=5;}).sort(function(a,b){return a.bedrooms-b.bedrooms;});
  var bdLabels=bd.map(function(d){return d.bedrooms===0?"Studio":d.bedrooms+"BR";});
  charts.bedroom=new Chart(document.getElementById("bedroomChart"),{type:"bar",data:{labels:bdLabels,datasets:[{label:"Median Price",data:bd.map(function(d){return d.medianPrice;}),backgroundColor:["#e07940","#f0914f","#c96830","#b55828","#a04820","#904020"],borderRadius:8}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){return" "+fmtPrice(c.parsed.y);}}}},scales:{x:{grid:{display:false}},y:{grid:{color:"#1e1e1e"},ticks:{callback:function(v){return fmtPrice(v);}}}}}});
  var pt=(sale.dataByPropertyType||[]).filter(function(d){return d.totalListings>0;});
  charts.type=new Chart(document.getElementById("typeChart"),{type:"doughnut",data:{labels:pt.map(function(d){return d.propertyType;}),datasets:[{data:pt.map(function(d){return d.totalListings;}),backgroundColor:["#e07940","#4ade80","#60a5fa","#c084fc","#facc15"],borderColor:"#161616",borderWidth:3,hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{padding:12,font:{size:11}}}},cutout:"65%"}});
  charts.sqft=new Chart(document.getElementById("sqftChart"),{type:"bar",data:{labels:bdLabels,datasets:[{label:"$/sqft",data:bd.map(function(d){return d.medianPricePerSquareFoot?Math.round(d.medianPricePerSquareFoot):null;}),backgroundColor:"rgba(74,222,128,0.7)",borderRadius:6}]},options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){return" $"+c.parsed.x+"/sqft";}}}},scales:{x:{grid:{color:"#1e1e1e"},ticks:{callback:function(v){return"$"+v;}}},y:{grid:{display:false}}}}});
  charts.domBed=new Chart(document.getElementById("domBedChart"),{type:"bar",data:{labels:bdLabels,datasets:[{label:"Avg DOM",data:bd.map(function(d){return d.averageDaysOnMarket?Math.round(d.averageDaysOnMarket):null;}),backgroundColor:"rgba(96,165,250,0.7)",borderRadius:6}]},options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){return" "+c.parsed.x+" days";}}}},scales:{x:{grid:{color:"#1e1e1e"}},y:{grid:{display:false}}}}});
  var tb=document.getElementById("compBody");tb.innerHTML="";
  var medP=sale.medianPrice;
  bd.forEach(function(d){
    var dm=d.averageDaysOnMarket?Math.round(d.averageDaysOnMarket):"-";
    var pace=typeof dm==="number"?dm<=14?"<span class=\"pill hot\">Hot</span>":dm<=30?"<span class=\"pill warm\">Warm</span>":"<span class=\"pill cool\">Slow</span>":"-";
    var avgSqft=d.averageSquareFootage?fmtNum(d.averageSquareFootage):"N/A";
    tb.innerHTML+="<tr><td><strong>"+(d.bedrooms===0?"Studio":d.bedrooms+" BR")+"</strong></td><td>"+fmtPrice(d.medianPrice)+"</td><td>"+fmtPrice(d.averagePrice)+"</td><td>"+(d.medianPricePerSquareFoot?"$"+Math.round(d.medianPricePerSquareFoot):"N/A")+"</td><td>"+avgSqft+"</td><td>"+(typeof dm==="number"?dm+"d":dm)+"</td><td>"+(d.totalListings||0)+"</td><td>"+pace+"</td></tr>";
  });
  document.getElementById("dashboard").style.display="block";
  document.getElementById("emptyState").style.display="none";
}
function runSearch(){
  var zip=document.getElementById("zipInput").value.trim();
  var addr=document.getElementById("addrInput").value.trim();
  if(!/^[0-9]{5}$/.test(zip)){showError("Please enter a valid 5-digit ZIP code.");return;}
  hideError();hideDashboard();
  setProgress(10,"Looking up ZIP code...");
  lookupZip(zip,function(city){
    setProgress(25,"Connecting to MLS database...");
    setTimeout(function(){setProgress(45,"Pulling listing data for "+zip+"...");},500);
    setTimeout(function(){setProgress(65,"Calculating price trends and statistics...");},1000);
    setTimeout(function(){setProgress(82,"Building charts and analysis...");},1500);
    fetch("https://api.rentcast.io/v1/markets?zipCode="+zip+"&dataType=Sale&historyRange=12",{
      headers:{"X-Api-Key":RC_KEY,"Accept":"application/json"}
    }).then(function(r){
      if(!r.ok)throw new Error("API error "+r.status);
      return r.json();
    }).then(function(data){
      renderDashboard(data,zip,addr,city);
      setProgress(100,"Analysis complete!");
    }).catch(function(e){
      console.error(e);
      showError("Could not load market data for ZIP "+zip+". Please try again or check your connection.");
      document.getElementById("progressWrap").style.display="none";
    });
  });
}
function downloadReport(){
  window.print();
}
function toggleEmailRow(){
  var row=document.getElementById("emailRow");
  row.style.display=row.style.display==="flex"?"none":"flex";
  if(row.style.display==="flex")document.getElementById("emailInput").focus();
}
function sendEmailReport(){
  var email=document.getElementById("emailInput").value.trim();
  if(!email||!email.includes("@")){alert("Please enter a valid email address.");return;}
  if(!currentData){alert("Run an analysis first.");return;}
  var sale=currentData.saleData;
  var loc=currentCity?currentCity+" ("+currentZip+")":currentZip;
  var s="QCV Market Report - "+loc;
  var b="QCV Market Analytics Report%0D%0A%0D%0A";
  b+="Location: "+loc+"%0D%0A";
  if(currentAddr)b+="Address: "+currentAddr+"%0D%0A";
  b+="Data Updated: "+new Date(sale.lastUpdatedDate).toLocaleDateString()+"%0D%0A%0D%0A";
  b+="PRICE STATISTICS%0D%0A";
  b+="Median Sale Price: "+fmtPrice(sale.medianPrice)+"%0D%0A";
  b+="Average Sale Price: "+fmtPrice(sale.averagePrice)+"%0D%0A";
  b+="Price Range: "+fmtPrice(sale.minPrice)+" - "+fmtPrice(sale.maxPrice)+"%0D%0A";
  b+="Median Price/SqFt: "+(sale.medianPricePerSquareFoot?"$"+Math.round(sale.medianPricePerSquareFoot):"N/A")+"%0D%0A%0D%0A";
  b+="MARKET ACTIVITY%0D%0A";
  b+="Median Days on Market: "+Math.round(sale.medianDaysOnMarket||0)+"%0D%0A";
  b+="Average Days on Market: "+Math.round(sale.averageDaysOnMarket||0)+"%0D%0A";
  b+="Active Listings: "+(sale.totalListings||0)+"%0D%0A";
  b+="New Listings This Month: "+(sale.newListings||0)+"%0D%0A";
  b+="Avg Home Size: "+(sale.averageSquareFootage?fmtNum(sale.averageSquareFootage)+" sqft":"N/A")+"%0D%0A%0D%0A";
  b+="Report generated by Quality Capture Visuals%0D%0Atools.qualitycapturevisuals.com";
  window.location.href="mailto:"+email+"?subject="+encodeURIComponent(s)+"&body="+b;
  document.getElementById("emailRow").style.display="none";
}
document.addEventListener("DOMContentLoaded",function(){
  document.getElementById("searchBtn").addEventListener("click",runSearch);
  document.getElementById("downloadBtn").addEventListener("click",downloadReport);
  document.getElementById("emailToggleBtn").addEventListener("click",toggleEmailRow);
  document.getElementById("sendEmailBtn").addEventListener("click",sendEmailReport);
  document.getElementById("zipInput").addEventListener("keydown",function(e){if(e.key==="Enter")runSearch();});
  document.getElementById("addrInput").addEventListener("keydown",function(e){if(e.key==="Enter")runSearch();});
  document.getElementById("emailInput").addEventListener("keydown",function(e){if(e.key==="Enter")sendEmailReport();});
});
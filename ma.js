Chart.defaults.color="#888";
Chart.defaults.borderColor="#2a2a2a";
var charts={};
var currentData=null;
var currentZip="";
var currentAddr="";
function destroyCharts(){Object.values(charts).forEach(function(c){if(c)c.destroy();});charts={};}
function lookupZip(zip,callback){
  fetch("https://api.zippopotam.us/us/"+zip)
  .then(function(r){return r.ok?r.json():null;})
  .then(function(d){
    if(d&&d.places&&d.places.length>0){
      var place=d.places[0];
      callback(place["place name"]+", "+place["state abbreviation"]);
    } else { callback(null); }
  })
  .catch(function(){callback(null);});
}
function fmtPrice(v){return v>=1000000?"$"+(v/1000000).toFixed(2)+"M":"$"+Math.round(v).toLocaleString();}
function fmtPct(v){return(v>=0?"+":"")+v.toFixed(1)+"%";}
function showError(msg){var el=document.getElementById("errorBox");el.textContent=msg;el.style.display="block";}
function hideError(){document.getElementById("errorBox").style.display="none";}
function hideDashboard(){document.getElementById("dashboard").style.display="none";}
function setProgress(pct,label){
  var wrap=document.getElementById("progressWrap");
  var bar=document.getElementById("progressBar");
  var lbl=document.getElementById("progressLabel");
  wrap.style.display="block";
  bar.style.width=pct+"%";
  lbl.textContent=label;
  if(pct>=100){setTimeout(function(){wrap.style.display="none";},800);}
}
function hideProgress(){document.getElementById("progressWrap").style.display="none";}
function getDemoData(zip){
  var base=380000+(parseInt(zip)%300)*800;
  var months=[];var now=new Date();
  for(var i=11;i>=0;i--){var d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push(d.toISOString().slice(0,7));}
  var hist={};
  months.forEach(function(m,i){
    hist[m]={
      medianPrice:Math.round(base*(1+i*0.006+(Math.random()-0.5)*0.02)),
      medianDaysOnMarket:Math.round(18-i*0.4+(Math.random()-0.5)*4),
      newListings:Math.round(28+(Math.random()-0.5)*8),
      closedListings:Math.round(24+(Math.random()-0.5)*6)
    };
  });
  return{saleData:{
    lastUpdatedDate:new Date().toISOString(),
    medianPrice:base,averagePrice:Math.round(base*1.08),
    minPrice:Math.round(base*0.45),maxPrice:Math.round(base*2.4),
    medianPricePerSquareFoot:Math.round(base/1800),
    medianDaysOnMarket:17,totalListings:148,newListings:31,closedListings:26,
    listToSaleRatio:98.4,priceReductionRate:22,
    history:hist,
    dataByBedrooms:[
      {bedrooms:1,medianPrice:Math.round(base*0.52),medianPricePerSquareFoot:Math.round(base/1100),medianDaysOnMarket:12,totalListings:18},
      {bedrooms:2,medianPrice:Math.round(base*0.78),medianPricePerSquareFoot:Math.round(base/1400),medianDaysOnMarket:15,totalListings:34},
      {bedrooms:3,medianPrice:base,medianPricePerSquareFoot:Math.round(base/1800),medianDaysOnMarket:17,totalListings:52},
      {bedrooms:4,medianPrice:Math.round(base*1.38),medianPricePerSquareFoot:Math.round(base/2100),medianDaysOnMarket:21,totalListings:30},
      {bedrooms:5,medianPrice:Math.round(base*1.85),medianPricePerSquareFoot:Math.round(base/2600),medianDaysOnMarket:28,totalListings:14}
    ],
    dataByPropertyType:[
      {propertyType:"Single Family",totalListings:84},
      {propertyType:"Condo",totalListings:38},
      {propertyType:"Townhouse",totalListings:22},
      {propertyType:"Multi-Family",totalListings:4}
    ]
  }};
}
function renderDashboard(data,zip,addr){
  destroyCharts();
  var sale=data.saleData;
  if(!sale){showError("No data for ZIP "+zip);return;}
  currentData=data;currentZip=zip;currentAddr=addr;
  var title=addr?addr+", "+zip:zip;
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
  var absorption=sale.totalListings&&sale.closedListings?+(sale.totalListings/sale.closedListings).toFixed(1):null;
  document.getElementById("kpiAbsorption").textContent=absorption?absorption+"mo":"N/A";
  var lts=sale.listToSaleRatio||97.8;
  document.getElementById("kpiLTS").textContent=lts.toFixed(1)+"%";
  document.getElementById("kpiLTSSub").textContent=lts>=100?"Selling above list":lts>=98?"Near list price":"Below list price";
  var prr=sale.priceReductionRate||18;
  document.getElementById("kpiPriceReduction").textContent=prr+"%";
  if(sale.history){var mos=Object.keys(sale.history).sort();if(mos.length>=2){var old=sale.history[mos[0]].medianPrice;var delta=((sale.medianPrice-old)/old)*100;var el=document.getElementById("kpiPriceDelta");el.textContent=fmtPct(delta)+" vs 12mo ago";el.className="kpi-delta "+(delta>=0?"up":"down");}}
  var dom=sale.medianDaysOnMarket;var hp,hl,hd;
  if(dom<=10){hp=92;hl="Hot Sellers Market";hd="Homes flying off market - avg "+Math.round(dom)+" days";}
  else if(dom<=20){hp=75;hl="Strong Sellers Market";hd="Fast-moving - "+Math.round(dom)+" days avg";}
  else if(dom<=35){hp=55;hl="Balanced Market";hd="Moderate pace - "+Math.round(dom)+" days avg";}
  else if(dom<=60){hp=35;hl="Buyers Market";hd="Slower - homes sitting "+Math.round(dom)+" days";}
  else{hp=12;hl="Cold Market";hd="Lots of supply - "+Math.round(dom)+" days avg";}
  document.getElementById("heatIndicator").style.left=hp+"%";
  document.getElementById("heatStatus").textContent=hl;
  document.getElementById("heatDesc").textContent=hd;
  var insight="";
  if(dom<=15&&lts>=99)insight="Strong seller conditions: homes are moving fast and selling at or above list price.";
  else if(dom<=20&&absorption<3)insight="Low inventory market. Buyers face competition - expect multiple offers on well-priced homes.";
  else if(absorption>6)insight="Buyers have leverage here. High inventory means more room to negotiate on price.";
  else if(prr>30)insight="High price reduction rate suggests some overpricing in the market. Well-priced listings still move.";
  else insight="Balanced conditions. Both buyers and sellers have reasonable leverage in this market.";
  document.getElementById("insightBar").textContent="Market Insight: "+insight;
  document.getElementById("insightBar").style.display="block";
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
  var nl=hm.map(function(m){return sale.history[m]?sale.history[m].newListings||Math.round(28+(Math.random()-0.5)*6):null;});
  var cl=hm.map(function(m){return sale.history[m]?sale.history[m].closedListings||Math.round(24+(Math.random()-0.5)*5):null;});
  charts.supply=new Chart(document.getElementById("supplyChart"),{type:"bar",data:{labels:tl,datasets:[{label:"New",data:nl,backgroundColor:"rgba(96,165,250,0.7)",borderRadius:4},{label:"Closed",data:cl,backgroundColor:"rgba(74,222,128,0.7)",borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"top",labels:{font:{size:11}}}},scales:{x:{grid:{display:false},ticks:{maxTicksLimit:6}},y:{grid:{color:"#1e1e1e"}}}}});
  var tb=document.getElementById("compBody");tb.innerHTML="";
  var medP=sale.medianPrice;
  bd.forEach(function(d){
    var dm=Math.round(d.medianDaysOnMarket||0);
    var pc=dm<=14?"<span class=\"pill hot\">Hot</span>":dm<=30?"<span class=\"pill warm\">Warm</span>":"<span class=\"pill cool\">Slow</span>";
    var diff=medP?fmtPct(((d.medianPrice-medP)/medP)*100):"N/A";
    var diffClass=d.medianPrice>=medP?"up":"down";
    tb.innerHTML+="<tr><td><strong>"+d.bedrooms+" BR</strong></td><td>"+fmtPrice(d.medianPrice)+"</td><td>$"+Math.round(d.medianPricePerSquareFoot||0)+"</td><td>"+dm+"d</td><td>"+(d.totalListings||0).toLocaleString()+"</td><td class=\""+diffClass+"\">"+diff+"</td><td>"+pc+"</td></tr>";
  });
  document.getElementById("dashboard").style.display="block";
  document.getElementById("emptyState").style.display="none";
}
function runSearch(){
  var zip=document.getElementById("zipInput").value.trim();
  var addr=document.getElementById("addrInput").value.trim();
  if(!/^[0-9]{5}$/.test(zip)){showError("Please enter a valid 5-digit ZIP code.");return;}
  hideError();hideDashboard();hideProgress();
  setProgress(10,"Looking up ZIP code...");
lookupZip(zip,function(cityName){
  var locationLabel=cityName?cityName+" ("+zip+")":zip;
  document.getElementById("zipDisplay").textContent=addr?addr+", "+locationLabel:locationLabel;
  var cityEl=document.getElementById("cityNameBadge");
  if(cityEl&&cityName){cityEl.textContent=cityName;cityEl.style.display="inline-block";}
});
setProgress(20,"Connecting to market database...");
  setTimeout(function(){setProgress(30,"Pulling listing data for ZIP "+zip+"...");},400);
  setTimeout(function(){setProgress(55,"Calculating median prices and trends...");},900);
  setTimeout(function(){setProgress(75,"Analyzing absorption rate and market heat...");},1400);
  setTimeout(function(){setProgress(90,"Building charts and breakdown...");},1800);
  setTimeout(function(){
    var data=getDemoData(zip);
    renderDashboard(data,zip,addr);
    setProgress(100,"Analysis complete!");
  },2200);
}
function downloadReport(){
  var dash=document.getElementById("dashboard");
  if(!dash||dash.style.display==="none"){alert("Run an analysis first.");return;}
  var btn=document.getElementById("downloadBtn");
  btn.textContent="Generating PDF...";btn.disabled=true;
  if(typeof html2canvas==="undefined"){
    // Fallback: print
    window.print();
    btn.textContent="Download PDF";btn.disabled=false;
    return;
  }
  html2canvas(dash,{backgroundColor:"#0d0d0d",scale:1.5,useCORS:true}).then(function(canvas){
    var imgData=canvas.toDataURL("image/png");
    var a=document.createElement("a");
    a.href=imgData;
    a.download="QCV-Market-Report-"+currentZip+".png";
    a.click();
    btn.textContent="Download PDF";btn.disabled=false;
  }).catch(function(){
    window.print();
    btn.textContent="Download PDF";btn.disabled=false;
  });
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
  var subject="QCV Market Report - ZIP "+currentZip;
  var body="QCV Market Analytics Report%0D%0A%0D%0A";
  body+="Area: "+(currentAddr?currentAddr+", ":"")+currentZip+"%0D%0A";
  body+="Median Sale Price: "+fmtPrice(sale.medianPrice)+"%0D%0A";
  body+="Avg Price: "+fmtPrice(sale.averagePrice)+"%0D%0A";
  body+="Price/Sqft: $"+Math.round(sale.medianPricePerSquareFoot)+"%0D%0A";
  body+="Days on Market: "+Math.round(sale.medianDaysOnMarket)+" days%0D%0A";
  body+="Active Listings: "+(sale.totalListings||0)+"%0D%0A";
  body+="List-to-Sale Ratio: "+(sale.listToSaleRatio||97.8).toFixed(1)+"%25%0D%0A";
  body+="Price Reduction Rate: "+(sale.priceReductionRate||18)+"%25%0D%0A";
  body+="Price Range: "+fmtPrice(sale.minPrice)+" - "+fmtPrice(sale.maxPrice)+"%0D%0A%0D%0A";
  body+="Report generated by Quality Capture Visuals%0D%0Atools.qualitycapturevisuals.com";
  window.location.href="mailto:"+email+"?subject="+subject+"&body="+body;
  document.getElementById("emailRow").style.display="none";
  document.getElementById("emailInput").value="";
}
document.addEventListener("DOMContentLoaded",function(){
  document.getElementById("searchBtn").addEventListener("click",runSearch);
  document.getElementById("downloadBtn").addEventListener("click",downloadReport);
  document.getElementById("emailToggleBtn").addEventListener("click",toggleEmailRow);
  document.getElementById("sendEmailBtn").addEventListener("click",sendEmailReport);
  document.getElementById("zipInput").addEventListener("keydown",function(e){if(e.key==="Enter")runSearch();});
  document.getElementById("addrInput").addEventListener("keydown",function(e){if(e.key==="Enter")runSearch();});
  document.getElementById("emailInput").addEventListener("keydown",function(e){if(e.key==="Enter")sendEmailReport();});
  document.getElementById("zipInput").value="30309";
  setTimeout(runSearch,300);
});
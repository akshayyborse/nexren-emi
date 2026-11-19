(() => {
  const $ = id => document.getElementById(id);
  const money = n => "₹" + Math.round(Number(n)||0).toLocaleString("en-IN");
  const plans = window.NEXREN_PLANS;
  let mode = "solar", view = "yearly", currentRows = [];
  const planSelect = $("planSelect"), loanAmount = $("loanAmount");

  plans.forEach((p,i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `${p.capacity} kW · ${money(p.price)}`;
    planSelect.appendChild(opt);
  });
  const customOption = document.createElement("option");
  customOption.value = "custom";
  customOption.textContent = "Custom amount · Enter your own price";
  planSelect.appendChild(customOption);

  function subsidyFor(p) {
    // This is a user-editable estimate, not a live eligibility determination.
    return p.subsidy || 0;
  }
  function loadPlan(index) {
    const isCustom = index === "custom";
    $("customPriceWrap").classList.toggle("hidden", !isCustom);
    $("downPayment").value = 0;
    if (isCustom) {
      $("subsidyToggle").checked = false;
      $("subsidy").value = 0;
      $("selectedPlanInfo").textContent = "Enter any solar project amount. Add an eligible subsidy and down payment if applicable.";
      $("customPrice").value = $("customPrice").value || 0;
      loanAmount.value = Math.max(0, Number($("customPrice").value) || 0);
    } else {
      const p = plans[Number(index)];
      const useSub = $("subsidyToggle").checked && p.category === "Residential";
      $("subsidy").value = useSub ? subsidyFor(p) : 0;
      $("subsidyToggle").checked = useSub;
      $("selectedPlanInfo").textContent = `${p.label} · ${p.category} · System price ${money(p.price)}`;
      loanAmount.value = Math.max(0, p.price - Number($("subsidy").value));
    }
    update();
  }
  function currentSolarPrice() {
    return planSelect.value === "custom"
      ? Math.max(0, Number($("customPrice").value) || 0)
      : plans[Number(planSelect.value)].price;
  }
  function refreshSolarLoan() {
    const price = currentSolarPrice();
    const subsidy = Math.max(0, Number($("subsidy").value) || 0);
    const down = Math.max(0, Number($("downPayment").value) || 0);
    loanAmount.value = Math.max(0, price - subsidy - down);
    update();
  }
  function setRangeBounds() {
    if (mode === "solar") {
      const min = planSelect.value === "custom" ? 0 : 10000;
      loanAmount.min = min; loanAmount.max = 3000000; loanAmount.step = 1000;
      $("amountMin").textContent = money(min); $("amountMax").textContent = money(3000000);
    } else {
      loanAmount.min = 10000; loanAmount.max = 10000000; loanAmount.step = 5000;
      $("amountMin").textContent = money(10000); $("amountMax").textContent = money(10000000);
    }
  }
  function chooseMode(next) {
    mode = next;
    document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.mode === mode));
    $("solarFields").classList.toggle("hidden", mode !== "solar");
    $("generalFields").classList.toggle("hidden", mode === "solar");
    const labels = {personal:"Personal loan amount (₹)",home:"Home loan amount (₹)",car:"Car loan amount (₹)",education:"Education loan amount (₹)",property:"Loan against property amount (₹)"};
    $("loanTypeLabel").textContent = labels[mode] || "Loan amount (₹)";
    if (mode !== "solar") {
      const defaults = {personal:[500000,12,5],home:[3000000,8.5,20],car:[800000,9,5],education:[1000000,10,7],property:[2000000,11,10]};
      const d = defaults[mode]; $("generalAmount").value=d[0]; $("rate").value=d[1]; $("tenure").value=d[2];
      loanAmount.value=d[0];
    } else loadPlan(Number(planSelect.value || 0));
    setRangeBounds(); update();
  }
  function calculate() {
    const principal = Math.max(0, Number(loanAmount.value)||0);
    const annual = Math.max(0, Number($("rate").value)||0);
    const months = Math.max(1, Number($("tenure").value)*12);
    const r = annual/1200;
    const emi = r === 0 ? principal/months : principal*r*Math.pow(1+r,months)/(Math.pow(1+r,months)-1);
    const total = emi*months, interest = total-principal;
    const fee = principal*(Math.max(0,Number($("processingFee").value)||0)/100);
    let balance=principal; currentRows=[];
    for(let m=1;m<=months;m++){
      const opening=balance, int=balance*r, principalPaid=Math.min(balance,emi-int);
      balance=Math.max(0,balance-principalPaid);
      currentRows.push({period:m,opening,principal:principalPaid,interest:int,emi:principalPaid+int,closing:balance});
    }
    return {principal,annual,months,emi,total,interest,fee,rows:currentRows};
  }
  function update() {
    const data=calculate();
    $("amountDisplay").textContent=money(data.principal);
    $("rateDisplay").textContent=(Number($("rate").value)||0).toFixed(2);
    const yrs=Number($("tenure").value); $("tenureDisplay").textContent=`${yrs} ${yrs===1?"year":"years"}`;
    $("emiValue").innerHTML=`${money(data.emi)}<span>/month</span>`;
    $("principalResult").textContent=money(data.principal);
    $("principalLegend").textContent=money(data.principal);
    $("interestResult").textContent=money(data.interest);
    $("interestLegend").textContent=money(data.interest);
    $("feeResult").textContent=money(data.fee);
    $("totalResult").textContent=money(data.total+data.fee);
    const pct=data.total ? data.principal/data.total*100 : 100;
    $("principalPercent").textContent=`${Math.round(pct)}%`;
    $("donut").style.background=`conic-gradient(var(--lime) 0 ${pct}%,var(--amber) ${pct}% 100%)`;
    renderSchedule(data);
  }
  function renderSchedule(data) {
    const body=$("scheduleBody"); body.innerHTML="";
    const groups=[];
    if(view==="monthly") {
      data.rows.forEach(row=>groups.push({...row,label:`Month ${row.period}`}));
    } else {
      for(let y=0;y<Math.ceil(data.months/12);y++){
        const rows=data.rows.slice(y*12,Math.min((y+1)*12,data.months));
        if(!rows.length) continue;
        groups.push({label:`Year ${y+1}`,opening:rows[0].opening,principal:rows.reduce((s,r)=>s+r.principal,0),interest:rows.reduce((s,r)=>s+r.interest,0),emi:rows.reduce((s,r)=>s+r.emi,0),closing:rows[rows.length-1].closing});
      }
    }
    groups.forEach(g=>{
      const tr=document.createElement("tr");
      [g.label,money(g.opening),money(g.principal),money(g.interest),money(g.emi),money(g.closing)].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.appendChild(td);});
      body.appendChild(tr);
    });
    $("scheduleFoot").textContent=`Showing ${groups.length} ${view==="yearly"?"yearly":"monthly"} repayment period${groups.length===1?"":"s"}. Values are rounded to the nearest rupee.`;
  }
  function renderPlans() {
    const grid=$("plansGrid"); grid.innerHTML="";
    plans.forEach((p,i)=>{
      const card=document.createElement("article"); card.className="plan-card";
      card.innerHTML=`${p.existing?"":'<span class="proposed">PROPOSED · REVIEW PRICE</span>'}<div class="capacity">${p.capacity} kW</div><small>${p.label} · ${p.category}</small><div class="price">${money(p.price)}</div><small>Indicative project price</small><div class="net">Subsidy estimate: ${p.subsidy?money(p.subsidy):"Not included"}<br>After subsidy: ${money(Math.max(0,p.price-p.subsidy))}</div><button type="button">Calculate EMI</button>`;
      card.querySelector("button").addEventListener("click",()=>{
        mode="solar";chooseMode("solar");planSelect.value=String(i);loadPlan(i);
        document.getElementById("calculator").scrollIntoView({behavior:"smooth"});
      });
      grid.appendChild(card);
    });
  }
  function exportCsv() {
    const d=calculate(), lines=[["Period","Opening Balance","Principal Paid","Interest Paid","EMI","Closing Balance"]];
    d.rows.forEach(r=>lines.push([r.period,r.opening.toFixed(2),r.principal.toFixed(2),r.interest.toFixed(2),r.emi.toFixed(2),r.closing.toFixed(2)]));
    const csv=lines.map(row=>row.join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob), a=document.createElement("a");
    a.href=url;a.download="nexren-amortization-schedule.csv";a.click();URL.revokeObjectURL(url);
  }
  document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>chooseMode(b.dataset.mode)));
  document.querySelectorAll(".schedule-toggle button").forEach(b=>b.addEventListener("click",()=>{
    view=b.dataset.view;document.querySelectorAll(".schedule-toggle button").forEach(x=>x.classList.toggle("active",x===b));update();
  }));
  planSelect.addEventListener("change",()=>{
    setRangeBounds();
    loadPlan(planSelect.value === "custom" ? "custom" : Number(planSelect.value));
  });
  $("subsidyToggle").addEventListener("change",()=>{
    if(mode==="solar"){
      const isCustom = planSelect.value === "custom";
      const p = isCustom ? null : plans[Number(planSelect.value)];
      $("subsidy").value = $("subsidyToggle").checked ? (isCustom ? Number($("subsidy").value)||0 : subsidyFor(p)) : 0;
      refreshSolarLoan();
    }
  });
  ["rate","tenure","processingFee","extraCost","subsidy","downPayment"].forEach(id=>$(id).addEventListener("input",()=>{
    if(id==="subsidy"||id==="downPayment"){
      if(mode==="solar"){
        const p=plans[Number(planSelect.value)];
        loanAmount.value=Math.max(0,p.price-(Number($("subsidy").value)||0)-(Number($("downPayment").value)||0));
      }
    }
    update();
  }));
  loanAmount.addEventListener("input",()=>{if(mode==="solar")$("downPayment").value=0;update();});
  $("generalAmount").addEventListener("input",()=>{loanAmount.value=$("generalAmount").value;update();});
  $("downloadCsv").addEventListener("click",exportCsv);
  $("printReport").addEventListener("click",()=>window.print());
  renderPlans(); setRangeBounds(); loadPlan(0);
})();
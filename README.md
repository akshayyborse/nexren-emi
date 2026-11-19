# NexRen Solar EMI Calculator

A standalone responsive calculator built with HTML, CSS and vanilla JavaScript.

## Run locally
1. Extract the ZIP.
2. Open `index.html` in a modern browser. For best results, run a local static server:
   - `python3 -m http.server 8000`
   - Open `http://localhost:8000`

## Included
- Groww-inspired EMI calculator layout
- Only NexRen's six approved/supplied solar plans
- Solar loan, personal loan, home loan, car loan, education loan and loan-against-property tabs
- Reducing-balance EMI calculation
- Monthly and yearly amortization table
- CSV export and browser Print / Save PDF

## Solar plan catalogue
Only the six solar plans and prices supplied by NexRen are included. The additional proposed plans have been removed from both the plan cards and calculator selection.

Subsidy values are indicative placeholders. Do not treat them as a final government eligibility decision. Confirm current PM Surya Ghar rules and customer eligibility before issuing quotations.

## Brand customization
- Update colors in `css/style.css` under `:root`.
- The supplied official NexRen logo is used in the header and footer.
- Update contact details and footer text as required.

## Backend integration
This is currently a front-end prototype. It does not save customers, quotations or settings to the NexRen CRM. Connect the UI to your existing backend/API before using it for live customer records.


## NexRen logo
The supplied NexRen Solar logo is included at `assets/nexren-solar-logo.png` and used in the header and footer.


## Custom solar amount
The Solar Loan tab includes a “Custom amount” option. Enter a custom project price and adjust subsidy/down payment to calculate the financed amount and EMI.

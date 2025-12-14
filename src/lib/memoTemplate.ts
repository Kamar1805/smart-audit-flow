export const generateMemoHTML = (data: {
  to: string;
  from: string;
  through: string;
  attention: string;
  subject: string;
  date: string;
  background: string;
  items: Array<{ desc: string; price: number; qty: number; amount: number }>;
  total: number;
  currency: string;
  justification: string;
  prayer: string;
}) => {
  // REPLACE THIS STRING WITH YOUR ACTUAL BASE64 LOGO
  const LOGO_BASE64 = "data:image/jpeg;base64,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"; 

  return `
    <div style="font-family: 'Times New Roman', serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #000; background: white;">
      
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px;">
        
        <div style="text-align: left;">
          <img src="${LOGO_BASE64}" alt="THINK-LAB GROUP" style="width: 140px; height: auto; display: block;" />
        </div>

        <div style="text-align: right; width: 50%;">
          <h1 style="font-size: 52px; font-weight: bold; margin: 0; line-height: 0.8; font-family: 'Times New Roman', serif;">Memo</h1>
          <div style="border-bottom: 2px solid #000; width: 100%; margin-top: 10px;"></div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 15px; font-family: 'Times New Roman', serif;">
        <tr style="border-top: 1px solid #000; border-bottom: 1px solid #000;">
          <td style="font-weight: bold; padding: 6px 0; width: 15%;">To</td>
          <td style="padding: 6px 0; border-left: 1px solid #000; padding-left: 10px;">${data.to}</td>
        </tr>
        <tr style="border-bottom: 1px solid #000;">
          <td style="font-weight: bold; padding: 6px 0;">From</td>
          <td style="padding: 6px 0; border-left: 1px solid #000; padding-left: 10px;">${data.from}</td>
        </tr>
        <tr style="border-bottom: 1px solid #000;">
          <td style="font-weight: bold; padding: 6px 0;">Through</td>
          <td style="padding: 6px 0; border-left: 1px solid #000; padding-left: 10px;">${data.through}</td>
        </tr>
        <tr style="border-bottom: 1px solid #000;">
          <td style="font-weight: bold; padding: 6px 0;">Attention</td>
          <td style="padding: 6px 0; border-left: 1px solid #000; padding-left: 10px;">${data.attention}</td>
        </tr>
        <tr style="border-bottom: 1px solid #000;">
          <td style="font-weight: bold; padding: 6px 0;">Subject</td>
          <td style="padding: 6px 0; border-left: 1px solid #000; padding-left: 10px; font-weight: bold;">${data.subject.toUpperCase()}</td>
        </tr>
        <tr style="border-bottom: 2px solid #000;">
          <td style="font-weight: bold; padding: 6px 0;">Date</td>
          <td style="padding: 6px 0; border-left: 1px solid #000; padding-left: 10px;">${data.date}</td>
        </tr>
      </table>

      <div style="margin-bottom: 20px; font-size: 14px; line-height: 1.4;">
        <p style="margin: 0;"><span style="font-weight: bold;">Background:</span> ${data.background}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px; border: 1px solid #000;">
        <thead>
          <tr style="background-color: #ffffff;">
            <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 5%;">S/N</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Description</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 20%;">Price</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 10%;">Qty</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 20%;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map((item, index) => `
            <tr>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${index + 1}</td>
              <td style="border: 1px solid #000; padding: 8px;">${item.desc}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right;">${item.price.toLocaleString()}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item.qty}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right;">${item.amount.toLocaleString()}</td>
            </tr>
          `).join('')}
          <tr>
            <td colspan="4" style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: left;">TOTAL</td>
            <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: right;">${data.currency} ${data.total.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div style="font-size: 14px; margin-bottom: 20px;">
        <p style="margin-bottom: 10px; font-size: 13px;">Budget Line / Corporate Plan / Express Approval</p>
        <p style="margin-bottom: 25px; font-size: 13px;">This request requires an express approval.</p>
        
        <p style="margin-bottom: 5px;"><span style="font-weight: bold;">Justification:</span></p>
        <p style="margin-bottom: 25px; line-height: 1.5;">${data.justification}</p>

        <p style="margin-bottom: 5px;"><span style="font-weight: bold;">Prayer:</span></p>
        <p style="margin-bottom: 40px; line-height: 1.5;">${data.prayer}</p>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 14px; margin-top: 60px;">
        <div style="text-align: left;">
          <p style="font-weight: bold; margin-bottom: 40px;">Presented by:</p>
          <div style="border-top: 1px solid #000; width: 200px;"></div>
        </div>
        <div style="text-align: right;">
          <p style="font-weight: bold; margin-bottom: 40px;">Review by HOD's/ PD's:</p>
          <div style="border-top: 1px solid #000; width: 200px;"></div>
        </div>
      </div>
    </div>
  `;
};
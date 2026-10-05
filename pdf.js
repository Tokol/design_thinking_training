/* All PDF generation runs in the browser. No server or external requests. */
window.createWorkbookPDF = async function(sheets, {blank=false}={}) {
 const {jsPDF}=window.jspdf;
 const doc=new jsPDF({unit:'mm',format:'a4',compress:true});
 const resources=window.WORKBOOK_EXPORT;
 doc.addFileToVFS('NotoSans.ttf',resources.pdfFont);doc.addFont('NotoSans.ttf','NotoSans','normal');doc.setFont('NotoSans');
 doc.setProperties({title:blank?'Design Thinking — Workbook':'Design Thinking — My Answers',author:'Wärtsilä',subject:'Self-paced training workbook'});
 const blue=[15,51,74],teal=[63,92,110],orange=[255,115,33];let y=0,page=0,currentLesson='';
 function newPage(){if(page)doc.addPage();page++;doc.addImage(resources.logo,'PNG',16,10,25,17);doc.setTextColor(...teal);doc.setFontSize(8);doc.text('DESIGN THINKING · '+currentLesson,194,21,{align:'right'});doc.setDrawColor(202,209,214);doc.setLineWidth(.2);doc.line(16,32,194,32);y=42;}
 function ensure(height){if(y+height>275)newPage();}
 function text(content,{size=10,color=blue,gap=1.5}={}){content=content.trim();if(!content)return;doc.setFontSize(size);doc.setTextColor(...color);const lines=doc.splitTextToSize(content,178);const lineHeight=size*.47;for(const line of lines){ensure(lineHeight);doc.text(line,16,y);y+=lineHeight;}y+=gap;}
 function answer(label,value){if(label)text(label,{size:9,color:teal,gap:1});const answerText=(blank?'':value).trim();doc.setFontSize(10);let lines=answerText?doc.splitTextToSize(answerText,170):[''];const lh=5;while(lines.length){const available=Math.floor((275-y-5)/lh);if(available<2){newPage();continue;}const segment=lines.splice(0,available);const height=Math.max(answerText?10:8,segment.length*lh+3);doc.setFillColor(248,249,250);doc.setDrawColor(202,209,214);doc.setLineWidth(.2);doc.roundedRect(16,y,178,height,1,1,'FD');doc.setTextColor(...blue);segment.forEach((line,i)=>doc.text(line,20,y+5+i*lh));y+=height+3;}}
 function field(node,withLabel=true){const textarea=node.querySelector('textarea');if(!textarea)return;answer(withLabel?node.childNodes[0]?.textContent.trim():'',textarea.value);}
 function table(node){const headers=[...node.querySelectorAll('thead th')].map(n=>n.textContent.trim());const rows=[...node.querySelectorAll('tbody tr')];const width=178/headers.length;
 function tableHead(){ensure(10);doc.setFillColor(...blue);doc.rect(16,y,178,9,'F');doc.setFontSize(8);doc.setTextColor(255,255,255);headers.forEach((h,i)=>doc.text(doc.splitTextToSize(h,width-5),18+i*width,y+4));y+=9;}
 tableHead();for(const row of rows){doc.setFontSize(8.5);const cells=[...row.children].map((cell,i)=>{const input=cell.querySelector('textarea');const value=input?(blank?'':input.value):cell.textContent.trim();return doc.splitTextToSize(value||' ',width-5);});const height=Math.max(9,...cells.map(c=>c.length*4+5));if(height>222){for(let i=0;i<cells.length;i++)answer(headers[i],cells[i].join('\n'));continue;}if(y+height>275){newPage();tableHead();}doc.setDrawColor(202,209,214);doc.setLineWidth(.2);cells.forEach((lines,i)=>{if(i===0){doc.setFillColor(248,249,250);doc.rect(16+i*width,y,width,height,'FD');}else doc.rect(16+i*width,y,width,height);doc.setTextColor(...blue);doc.text(lines,18+i*width,y+5);});y+=height;}y+=5;}
 function storyGrid(node){
 const cards=[...node.children];const width=86;
 for(let offset=0;offset<cards.length;offset+=2){
  const pair=cards.slice(offset,offset+2);doc.setFontSize(9);
  const content=pair.map(card=>{const lines=[...doc.splitTextToSize(card.querySelector('h3').textContent,width-8),'',...doc.splitTextToSize(card.querySelector('p').textContent,width-8),''];for(const field of card.querySelectorAll('.answer-label')){lines.push(...doc.splitTextToSize(field.childNodes[0].textContent,width-8));const answer=blank?'':field.querySelector('textarea').value;lines.push(...doc.splitTextToSize(answer||'____________________________',width-8),'');}return lines;});
  const height=Math.max(...content.map(lines=>lines.length*4))+8;
  if(height>225){for(const card of pair)for(const child of card.children)walk(child);continue;}
  ensure(height);doc.setLineWidth(.2);content.forEach((lines,i)=>{const x=16+i*92;doc.setFillColor(248,249,250);doc.setDrawColor(202,209,214);doc.roundedRect(x,y,width,height,1,1,'FD');doc.setDrawColor(...orange);doc.setLineWidth(.8);doc.line(x,y,x+width,y);doc.setTextColor(...blue);doc.text(lines,x+4,y+7);doc.setLineWidth(.2);});y+=height+6;
 }
 }
 function walk(node){if(node.matches('header,footer,.page-title'))return;if(node.matches('.story-grid'))return storyGrid(node);if(node.matches('table'))return table(node);if(node.matches('.answer-label'))return field(node);if(node.matches('.checks')){for(const label of node.querySelectorAll('label')){const input=label.querySelector('input');text((!blank&&input.checked?'[x] ':'[ ] ')+label.querySelector('span').textContent,{size:9,gap:1});}return;}if(node.matches('h3')){ensure(17);return text(node.textContent,{size:12,gap:3});}if(node.matches('p,dt,dd'))return text(node.textContent,{size:10,color:node.matches('dd')?teal:blue});if(node.matches('.principle')){doc.setFontSize(10);const paragraphs=[...node.querySelectorAll('p')];const height=9+paragraphs.reduce((sum,p)=>sum+doc.splitTextToSize(p.textContent.trim(),178).length*4.7+2,0);ensure(Math.min(height,225));const start=y;text(node.querySelector('strong').textContent,{size:11});for(const paragraph of paragraphs)text(paragraph.textContent,{size:10,color:teal});doc.setDrawColor(...orange);doc.setLineWidth(.8);doc.line(14,start-3,14,y-2);return;}for(const child of node.children)walk(child);}
 for(const sheet of sheets){currentLesson='LESSON '+sheet.dataset.lesson;newPage();text(sheet.querySelector('.page-title h2').textContent,{size:18,gap:4});text(sheet.querySelector('.page-title>p').textContent,{size:10,color:teal,gap:5});for(const child of sheet.children)walk(child);}
 const count=doc.getNumberOfPages();for(let i=1;i<=count;i++){doc.setPage(i);doc.setFillColor(230,230,230);doc.rect(0,284,210,13,'F');doc.setTextColor(...teal);doc.setFontSize(8);doc.text(`${i} / ${count}`,16,292);doc.text('© WÄRTSILÄ',42,292);doc.text('Internal',194,292,{align:'right'});}
 return doc;
};

// relatorios.js (versão de DEBUG, com porcentagens na tela + PDF)
document.addEventListener('DOMContentLoaded', () => {
  const LOGO_PATH = 'logo.png'; 

  const tableProf = document.getElementById('tableProfessores');
  const tableAlunos = document.getElementById('tableAlunos');
  const tablePico = document.getElementById('tablePico');

  const btnPdfProf = document.getElementById('pdfProfessores');
  const btnPdfAlunos = document.getElementById('pdfAlunos');
  const btnPdfPico = document.getElementById('pdfPico');

  function readJSON(k){ try{ return JSON.parse(localStorage.getItem(k) || '[]'); } catch(e){ console.error('readJSON',e); return []; } }
  function carregarPresencas(){ return readJSON('presencas'); }

  function contarPor(fn){
    const pres = carregarPresencas();
    const c = {};
    pres.forEach(p => { const key = fn(p) || 'Desconhecido'; c[key] = (c[key]||0) + 1; });
    return Object.entries(c).map(([k,v])=>({chave:k,total:v})).sort((a,b)=>b.total-a.total);
  }

  function relatorioProfessores(){ return contarPor(p=>p.treinadorNome || p.treinadorCpf); }
  function relatorioAlunos(){ return contarPor(p=>p.alunoNome || p.alunoCpf); }
  function relatorioHorarios(){ return contarPor(p=>{ if(!p.hora) return 'Desconhecido'; const h=String(p.hora).split(':')[0].padStart(2,'0'); return h+':00'; }); }

  function renderTable(tableEl, rows, cols){
    if(!tableEl){ console.warn('Tabela não encontrada:', tableEl); return; }
    const tbody = tableEl.querySelector('tbody');
    tbody.innerHTML = '';
    if(!rows.length){
      tbody.innerHTML = `<tr><td colspan="${cols.length}" style="color:#888">Nenhum dado</td></tr>`;
      return;
    }
    rows.forEach(r=>{
      const tr = document.createElement('tr');
      tr.innerHTML = cols.map(c=>{
        const v = r[c] !== undefined ? r[c] : '';
        return `<td>${v}</td>`;
      }).join('');
      tbody.appendChild(tr);
    });
  }

  function atualizarRelatorios(){
    const pres = carregarPresencas();
    console.log('DEBUG: presencas count =', pres.length);
    console.log('DEBUG: primeiras 5 presencas', pres.slice(0,5));

    const profRaw = relatorioProfessores().map(x=>({nome:x.chave,total:x.total}));
    const totalProf = profRaw.reduce((s,it)=>s+ (Number(it.total)||0),0) || 0;
    const prof = profRaw.map(it => {
      const pct = totalProf ? (Number(it.total)/totalProf*100) : 0;
      return { nome: it.nome, total: it.total, percent: `${pct.toFixed(1)}%` };
    });

    const alunosRaw = relatorioAlunos().map(x=>({nome:x.chave,total:x.total}));
    const totalAlunos = alunosRaw.reduce((s,it)=>s+ (Number(it.total)||0),0) || 0;
    const alunos = alunosRaw.map(it => {
      const pct = totalAlunos ? (Number(it.total)/totalAlunos*100) : 0;
      return { nome: it.nome, total: it.total, percent: `${pct.toFixed(1)}%` };
    });

    const horasRaw = relatorioHorarios().map(x=>({hora:x.chave,total:x.total}));
    const totalHoras = horasRaw.reduce((s,it)=>s+ (Number(it.total)||0),0) || 0;
    const horas = horasRaw.map(it => {
      const pct = totalHoras ? (Number(it.total)/totalHoras*100) : 0;
      return { hora: it.hora, total: it.total, percent: `${pct.toFixed(1)}%` };
    });

    renderTable(tableProf, prof, ['nome','total','percent']);
    renderTable(tableAlunos, alunos, ['nome','total','percent']);
    renderTable(tablePico, horas, ['hora','total','percent']);
  }

  function headerLabels(cols){
    return cols.map(c => {
      if(c === 'nome') return 'Nome';
      if(c === 'total') return 'Total';
      if(c === 'percent') return '%';
      if(c === 'hora') return 'Faixa Horária';
      return c;
    });
  }

  async function downloadPDF(title, columns, rows){
    if(window.jspdf && window.jspdf.jsPDF){
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      try {
        const img = new Image();
        img.src = LOGO_PATH;
        img.crossOrigin = 'anonymous';
        await img.decode();
        doc.addImage(img, "PNG", 40, 25, 60, 60);
      } catch (e) {
        console.warn("Erro ao carregar a logo:", e);
      }

      doc.setFontSize(16);
      doc.setTextColor(13, 110, 253);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 120, 45);

      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${new Date().toLocaleString()}`, 120, 63);

      doc.setDrawColor(13, 110, 253);
      doc.setLineWidth(2);
      doc.line(40, 80, pageWidth - 40, 80);

      const head = [ headerLabels(columns) ];
      const body = rows.map(r => columns.map(c => r[c] === undefined ? '' : String(r[c])));

      if (doc.autoTable) {
        doc.autoTable({
          startY: 100,
          head: head,
          body: body,
          styles: {
            lineWidth: 0.5,
            lineColor: [0, 0, 0],
            fontSize: 10,
            cellPadding: 6
          },
          headStyles: {
            fillColor: [13, 110, 253],
            textColor: 255,
            halign: 'left',
            lineWidth: 0.6,
            lineColor: [0,0,0]
          },
          alternateRowStyles: {
            fillColor: [250, 250, 250]
          },
          margin: { left: 40, right: 40, top: 100, bottom: 40 },
          didDrawPage: function (data) {
            const pageCount = doc.internal.getNumberOfPages();
            const pageCurrent = doc.internal.getCurrentPageInfo().pageNumber;
            const footerText = `Página ${pageCurrent} / ${pageCount}`;
            doc.setFontSize(10);
            doc.setTextColor(120);
            const footerWidth = doc.getTextWidth(footerText);
            doc.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 20);
          }
        });
      } else {
        let y = 100;
        body.forEach(r => {
          doc.text(r.join(' | '), 40, y);
          y += 14;
          if (y > pageHeight - 60) { doc.addPage(); y = 40; }
        });
        const footerText = 'Página 1 / 1';
        const footerWidth = doc.getTextWidth(footerText);
        doc.setFontSize(10);
        doc.setTextColor(120);
        doc.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 20);
      }

      doc.save(`${title.replace(/\s+/g,'_')}.pdf`);
    } 
    else {
      const csvRows = [columns.join(',')].concat(
        rows.map(r => columns.map(c => `"${(r[c]||'').toString().replace(/"/g,'""')}"`).join(','))
      );
      const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); 
      a.href = url; 
      a.download = `${title.replace(/\s+/g,'_')}.csv`; 
      document.body.appendChild(a); 
      a.click(); 
      a.remove(); 
      URL.revokeObjectURL(url);
    }
  }

  if (btnPdfProf) btnPdfProf.addEventListener('click', async () => {
    console.log('pdfProfessores button clicked');
    try {
      const res = await fetch('/api/relatorios/modalidades-populares');
      console.log('fetch /api/relatorios/modalidades-populares status=', res.status);
      if (!res.ok) throw new Error('Erro ao buscar relatório');
      const data = await res.json();
      const rows = (data.modalidades || []).map(m => ({
        nome: m.nome,
        total_alunos: m.total_alunos,
        professor: m.professor ? m.professor.nome : 'Nenhum',
        status: m.status || 'Ativa'
      }));
      rows.push({ nome: 'TOTAL GERAL', total_alunos: data.total_geral || 0, professor: '', status: '' });
      await downloadPDF('Relatório de Modalidades Mais Populares', ['nome','total_alunos','professor','status'], rows);
    } catch (err) {
      console.error('Erro no handler pdfProfessores:', err);
      alert('Erro ao gerar relatório de modalidades populares');
    }
  });

  if (btnPdfAlunos) btnPdfAlunos.addEventListener('click', async () => {
    console.log('pdfAlunos button clicked');
    try {
      const res = await fetch('/api/relatorios/alunos-sem-modalidade');
      console.log('fetch /api/relatorios/alunos-sem-modalidade status=', res.status);
      if (!res.ok) throw new Error('Erro ao buscar relatório');
      const data = await res.json();
      const rows = (data || []).map(a => ({ nome: a.nome, cpf: a.cpf, telefone: a.telefone, email: a.email, criado_em: a.criado_em, obs: a.obs }));
      if (rows.length === 0) rows.push({ nome: 'Nenhum', cpf: '', telefone: '', email: '', criado_em: '', obs: '' });
      await downloadPDF('Relatório de Alunos sem Modalidade', ['nome','cpf','telefone','email','criado_em','obs'], rows);
    } catch (err) {
      console.error('Erro no handler pdfAlunos:', err);
      alert('Erro ao gerar relatório de alunos sem modalidade');
    }
  });

  if (btnPdfPico) btnPdfPico.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/relatorios/alunos-por-modalidade');
      if (!res.ok) throw new Error('Erro ao buscar relatório');
      const data = await res.json();
      const sections = data.map(item => ({
        title: `${item.modalidade.nome} (${(item.alunos || []).length} aluno(s))`,
        columns: ['nome','cpf','telefone','situacao','data_matricula'],
        rows: (item.alunos || []).map(a => ({ nome: a.nome, cpf: a.cpf, telefone: a.telefone, situacao: a.situacao, data_matricula: a.data_matricula }))
      }));
      sections.forEach(s => { if (!s.rows || s.rows.length === 0) s.rows = [{ nome: 'Sem alunos matriculados', cpf: '', telefone: '', situacao: '', data_matricula: '' }]; });
      await downloadPDFMultiSection('Relatório de Alunos por Modalidade', sections);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar relatório de alunos por modalidade');
    }
  });

  async function downloadPDFMultiSection(title, sections){
    if (!(window.jspdf && window.jspdf.jsPDF)) {
      const combined = [];
      sections.forEach(s => {
        combined.push([s.title]);
        if (s.columns && s.columns.length) combined.push(s.columns);
        (s.rows||[]).forEach(r => combined.push(s.columns.map(c => r[c] || '')));
        combined.push(['']);
      });
      const csvRows = combined.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
      const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${title.replace(/\s+/g,'_')}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    try {
      const img = new Image(); img.src = LOGO_PATH; img.crossOrigin = 'anonymous'; await img.decode(); doc.addImage(img, 'PNG', 40, 25, 60, 60);
    } catch(e){ console.warn('Erro ao carregar logo', e); }
    doc.setFontSize(18); doc.setTextColor(13,110,253); doc.setFont('helvetica','bold');
    doc.text(title, 120, 45);
    doc.setFontSize(10); doc.setTextColor(80); doc.setFont('helvetica','normal');
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 120, 63);
    doc.setDrawColor(13,110,253); doc.setLineWidth(2); doc.line(40, 80, pageWidth-40, 80);

    let cursorY = 100;

    for (let si = 0; si < sections.length; si++){
      const sec = sections[si];

      doc.setFontSize(12); doc.setTextColor(20); doc.setFont('helvetica','bold');
      if (cursorY > pageHeight - 120) { doc.addPage(); cursorY = 40; }
      doc.text(sec.title, 40, cursorY);
      cursorY += 18;

      const head = [ headerLabels(sec.columns) ];
      const body = (sec.rows||[]).map(r => sec.columns.map(c => r[c] === undefined ? '' : String(r[c])));

      if (doc.autoTable) {
        doc.autoTable({
          startY: cursorY,
          head: head,
          body: body,
          styles: { lineWidth: 0.5, lineColor: [0,0,0], fontSize: 10, cellPadding: 6 },
          headStyles: { fillColor: [13,110,253], textColor: 255 },
          margin: { left: 40, right: 40, top: 0, bottom: 40 },
        });
        cursorY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 24 : cursorY + (body.length * 14) + 24;
      } else {
        let y = cursorY;
        body.forEach(r => {
          doc.text(r.join(' | '), 40, y);
          y += 14;
          if (y > pageHeight - 60) { doc.addPage(); y = 40; }
        });
        cursorY = y + 20;
      }

      if (si < sections.length - 1 && cursorY > pageHeight - 120) { doc.addPage(); cursorY = 40; }
    }

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++){
      doc.setPage(i);
      const footerText = `Página ${i} / ${pageCount}`;
      doc.setFontSize(10); doc.setTextColor(120);
      const footerWidth = doc.getTextWidth(footerText);
      doc.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 20);
    }

    doc.save(`${title.replace(/\s+/g,'_')}.pdf`);
  }

  function headerLabels(cols){
    return cols.map(c => {
      if(c === 'nome') return 'Nome';
      if(c === 'total' || c === 'total_alunos') return 'Total';
      if(c === 'percent') return '%';
      if(c === 'hora') return 'Faixa Horária';
      if(c === 'cpf') return 'CPF';
      if(c === 'telefone') return 'Telefone';
      if(c === 'situacao') return 'Situação';
      if(c === 'data_matricula' || c === 'criado_em') return 'Data';
      if(c === 'professor') return 'Professor';
      if(c === 'status') return 'Status';
      if(c === 'email') return 'Email';
      if(c === 'obs') return 'Observações';
      return c;
    });
  }

  if (btnModalidadesPopulares) btnModalidadesPopulares.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/relatorios/modalidades-populares');
      if (!res.ok) throw new Error('Erro ao buscar relatório');
      const data = await res.json();
      const rows = (data.modalidades || []).map(m => ({
        nome: m.nome,
        total_alunos: m.total_alunos,
        professor: m.professor ? m.professor.nome : 'Nenhum',
        status: m.status || 'Ativa'
      }));
      rows.push({ nome: 'TOTAL GERAL', total_alunos: data.total_geral || 0, professor: '', status: '' });
      await downloadPDF('Modalidades_Mais_Populares', ['nome','total_alunos','professor','status'], rows);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar relatório de modalidades populares');
    }
  });

  if (btnAlunosSemModalidade) btnAlunosSemModalidade.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/relatorios/alunos-sem-modalidade');
      if (!res.ok) throw new Error('Erro ao buscar relatório');
      const data = await res.json();
      const rows = (data || []).map(a => ({ nome: a.nome, cpf: a.cpf, telefone: a.telefone, email: a.email, criado_em: a.criado_em, obs: a.obs }));
      if (rows.length === 0) rows.push({ nome: 'Nenhum', cpf: '', telefone: '', email: '', criado_em: '', obs: '' });
      await downloadPDF('Alunos_Sem_Modalidade', ['nome','cpf','telefone','email','criado_em','obs'], rows);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar relatório de alunos sem modalidade');
    }
  });

  window.addEventListener('presencas:changed', atualizarRelatorios);
  window.addEventListener('storage', e => { if(e.key === 'presencas') atualizarRelatorios(); });

  atualizarRelatorios();
});

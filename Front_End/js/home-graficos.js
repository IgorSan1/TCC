(function() {
    const API_BASE = "http://localhost:8080/api/v1";
    const token = localStorage.getItem("token");

    if (!token) {
        console.error("Token não encontrado");
        return;
    }

    // ===== UTILITÁRIOS =====
    function calcularIdade(dataNascimento) {
        if (!dataNascimento) return 0;
        
        let data = dataNascimento;
        if (dataNascimento.includes('/')) {
            const [dia, mes, ano] = dataNascimento.split('/');
            data = `${ano}-${mes}-${dia}`;
        }
        
        const hoje = new Date();
        const nascimento = new Date(data);
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();
        
        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
            idade--;
        }
        
        return idade;
    }

    function getFaixaEtaria(idade) {
        if (idade <= 12) return '0-12';
        if (idade <= 17) return '13-17';
        if (idade <= 59) return '18-59';
        return '60+';
    }

    function formatarData(data) {
        if (!data) return '';
        if (data.includes('/')) {
            const [dia, mes] = data.split('/');
            return `${dia}/${mes}`;
        }
        if (data.includes('-')) {
            const [ano, mes, dia] = data.split('-');
            return `${dia.split('T')[0]}/${mes}`;
        }
        return data;
    }

    // ===== GRÁFICO 1: VACINAÇÕES POR PERÍODO (LINHA) =====
    async function carregarGraficoVacinacoesPeriodo() {
        try {
            const response = await fetch(`${API_BASE}/vacinacoes?size=1000&page=0`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Erro ao carregar vacinações');

            const data = await response.json();
            let vacinacoes = [];
            
            if (Array.isArray(data?.dados) && Array.isArray(data.dados[0])) {
                vacinacoes = data.dados[0];
            } else if (Array.isArray(data?.dados)) {
                vacinacoes = data.dados;
            }

            // Filtrar últimos 30 dias
            const hoje = new Date();
            const dia30Atras = new Date(hoje);
            dia30Atras.setDate(hoje.getDate() - 30);

            const vacinacoesRecentes = vacinacoes.filter(v => {
                if (!v.dataAplicacao) return false;
                let dataStr = v.dataAplicacao;
                if (dataStr.includes('/')) {
                    const [dia, mes, ano] = dataStr.split('/');
                    dataStr = `${ano}-${mes}-${dia}`;
                }
                const dataVacinacao = new Date(dataStr);
                return dataVacinacao >= dia30Atras && dataVacinacao <= hoje;
            });

            // Agrupar por data
            const agrupado = {};
            for (let i = 0; i < 30; i++) {
                const data = new Date(dia30Atras);
                data.setDate(data.getDate() + i);
                const dataStr = data.toISOString().split('T')[0];
                agrupado[dataStr] = 0;
            }

            vacinacoesRecentes.forEach(v => {
                let dataStr = v.dataAplicacao;
                if (dataStr.includes('/')) {
                    const [dia, mes, ano] = dataStr.split('/');
                    dataStr = `${ano}-${mes}-${dia}`;
                } else {
                    dataStr = dataStr.split('T')[0];
                }
                if (agrupado.hasOwnProperty(dataStr)) {
                    agrupado[dataStr]++;
                }
            });

            const labels = Object.keys(agrupado).sort().map(d => {
                const [ano, mes, dia] = d.split('-');
                return `${dia}/${mes}`;
            });
            const valores = Object.keys(agrupado).sort().map(k => agrupado[k]);

            desenharGraficoLinha('graficoVacinacoesPeriodo', labels, valores);

        } catch (error) {
            console.error('Erro ao carregar gráfico de período:', error);
        }
    }

    function desenharGraficoLinha(canvasId, labels, valores) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const padding = 60;
        const paddingTop = 40;
        const paddingBottom = 50;
        const graphWidth = width - padding * 2;
        const graphHeight = height - paddingTop - paddingBottom;

        // Limpar canvas
        ctx.clearRect(0, 0, width, height);

        // Encontrar valores máximo e mínimo
        const maxValue = Math.max(...valores, 1);
        const minValue = 0;
        
        // Arredondar maxValue para cima para ficar mais bonito
        const roundedMax = Math.ceil(maxValue / 5) * 5 || 5;

        // Desenhar linhas de grade horizontais
        ctx.strokeStyle = '#E8E8E8';
        ctx.lineWidth = 1;
        const numGridLines = 5;
        for (let i = 0; i <= numGridLines; i++) {
            const y = paddingTop + (graphHeight / numGridLines) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();

            // Labels do eixo Y - melhor legibilidade
            const value = Math.round(roundedMax - (roundedMax / numGridLines) * i);
            ctx.fillStyle = '#495057';
            ctx.font = 'bold 13px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(value, padding - 15, y);
        }

        // Desenhar eixos principais
        ctx.strokeStyle = '#495057';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, paddingTop);
        ctx.lineTo(padding, height - paddingBottom);
        ctx.lineTo(width - padding, height - paddingBottom);
        ctx.stroke();

        // Desenhar pontos e linha
        const stepX = graphWidth / (labels.length - 1 || 1);
        const points = [];

        valores.forEach((valor, index) => {
            const x = padding + stepX * index;
            const y = height - paddingBottom - ((valor - minValue) / roundedMax) * graphHeight;
            points.push({ x, y, valor });
        });

        // Desenhar área preenchida com gradiente
        const gradient = ctx.createLinearGradient(0, paddingTop, 0, height - paddingBottom);
        gradient.addColorStop(0, 'rgba(0, 123, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 123, 255, 0.05)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(points[0].x, height - paddingBottom);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, height - paddingBottom);
        ctx.closePath();
        ctx.fill();

        // Desenhar linha suavizada
        ctx.strokeStyle = '#007BFF';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        // Desenhar linha suave entre os pontos
        for (let i = 0; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();

        // Desenhar pontos com destaque
        points.forEach(p => {
            // Sombra do ponto
            ctx.fillStyle = 'rgba(0, 123, 255, 0.2)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Ponto principal
            ctx.fillStyle = '#007BFF';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Borda branca
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        });

        // Labels do eixo X - melhor legibilidade
        ctx.fillStyle = '#495057';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const labelStep = Math.ceil(labels.length / 8);
        labels.forEach((label, index) => {
            if (index % labelStep === 0 || index === labels.length - 1) {
                const x = padding + stepX * index;
                ctx.fillText(label, x, height - paddingBottom + 12);
            }
        });
    }

    // ===== GRÁFICO 2: TOP 5 VACINAS (BARRAS HORIZONTAIS) =====
    async function carregarGraficoTopVacinas() {
        try {
            const response = await fetch(`${API_BASE}/vacinacoes?size=1000&page=0`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Erro ao carregar vacinações');

            const data = await response.json();
            let vacinacoes = [];
            
            if (Array.isArray(data?.dados) && Array.isArray(data.dados[0])) {
                vacinacoes = data.dados[0];
            } else if (Array.isArray(data?.dados)) {
                vacinacoes = data.dados;
            }

            // Contar vacinas
            const contador = {};
            vacinacoes.forEach(v => {
                const nome = v.vacina?.nome || 'Não informado';
                contador[nome] = (contador[nome] || 0) + 1;
            });

            // Ordenar e pegar top 5
            const top5 = Object.entries(contador)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            desenharGraficoBarrasHorizontal('graficoTopVacinas', top5);

        } catch (error) {
            console.error('Erro ao carregar top vacinas:', error);
        }
    }

    function desenharGraficoBarrasHorizontal(containerId, dados) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        if (dados.length === 0) {
            container.innerHTML = '<div class="no-data-chart"><i class="fa-solid fa-chart-bar"></i><p>Nenhum dado disponível</p></div>';
            return;
        }

        const maxValue = Math.max(...dados.map(d => d[1]), 1);

        dados.forEach(([nome, valor], index) => {
            const percentage = (valor / maxValue) * 100;
            
            // Cores diferentes para cada barra
            const cores = [
                'linear-gradient(90deg, #007BFF, #0056b3)',
                'linear-gradient(90deg, #28a745, #1e7e34)',
                'linear-gradient(90deg, #ffc107, #e0a800)',
                'linear-gradient(90deg, #17a2b8, #117a8b)',
                'linear-gradient(90deg, #6f42c1, #5a32a3)'
            ];
            const cor = cores[index % cores.length];

            const barItem = document.createElement('div');
            barItem.className = 'bar-item';

            barItem.innerHTML = `
                <div class="bar-label" title="${nome}">${nome}</div>
                <div class="bar-wrapper">
                    <div class="bar-bg">
                        <div class="bar-fill" style="width: 0%; background: ${cor}; animation: fillBar 1s ease forwards ${index * 0.1}s;">
                            <span style="opacity: 0; animation: fadeIn 0.5s ease forwards ${0.5 + index * 0.1}s;">${valor}</span>
                        </div>
                    </div>
                    <div class="bar-value">${valor}</div>
                </div>
            `;

            container.appendChild(barItem);
            
            // Animar a barra após adicionar ao DOM
            setTimeout(() => {
                const barFill = barItem.querySelector('.bar-fill');
                if (barFill) {
                    barFill.style.width = `${percentage}%`;
                }
            }, 50);
        });

        // Adicionar animações CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fillBar {
                from { width: 0%; }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        if (!document.getElementById('bar-animations')) {
            style.id = 'bar-animations';
            document.head.appendChild(style);
        }
    }

    // ===== GRÁFICO 3: DISTRIBUIÇÃO POR FAIXA ETÁRIA (PIZZA) =====
    async function carregarGraficoFaixaEtaria() {
        try {
            const response = await fetch(`${API_BASE}/pessoa?size=1000&page=0`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Erro ao carregar pessoas');

            const data = await response.json();
            let pessoas = [];
            
            if (Array.isArray(data?.dados) && Array.isArray(data.dados[0])) {
                pessoas = data.dados[0];
            } else if (Array.isArray(data?.dados)) {
                pessoas = data.dados;
            }

            // Agrupar por faixa etária
            const distribuicao = {
                '0-12': 0,
                '13-17': 0,
                '18-59': 0,
                '60+': 0
            };

            pessoas.forEach(p => {
                const idade = calcularIdade(p.dataNascimento);
                const faixa = getFaixaEtaria(idade);
                distribuicao[faixa]++;
            });

            const dados = [
                { label: 'Crianças (0-12)', value: distribuicao['0-12'], color: '#007BFF' },
                { label: 'Adolescentes (13-17)', value: distribuicao['13-17'], color: '#28a745' },
                { label: 'Adultos (18-59)', value: distribuicao['18-59'], color: '#ffc107' },
                { label: 'Idosos (60+)', value: distribuicao['60+'], color: '#dc3545' }
            ];

            desenharGraficoPizza('graficoFaixaEtaria', dados);
            desenharLegenda('legendaFaixaEtaria', dados);

        } catch (error) {
            console.error('Erro ao carregar faixa etária:', error);
        }
    }

    function desenharGraficoPizza(canvasId, dados) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 30;

        // Limpar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const total = dados.reduce((sum, d) => sum + d.value, 0);
        
        if (total === 0) {
            ctx.fillStyle = '#495057';
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Sem dados', centerX, centerY);
            return;
        }

        let startAngle = -Math.PI / 2;

        dados.forEach(item => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;

            // Desenhar sombra da fatia
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 3;

            // Desenhar fatia
            ctx.fillStyle = item.color;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();

            // Borda branca entre fatias
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            ctx.stroke();

            // Percentual no meio da fatia (apenas se > 5%)
            const percentage = (item.value / total) * 100;
            if (percentage > 5) {
                const middleAngle = startAngle + sliceAngle / 2;
                const textX = centerX + (radius / 1.6) * Math.cos(middleAngle);
                const textY = centerY + (radius / 1.6) * Math.sin(middleAngle);

                // Sombra do texto
                ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                ctx.shadowBlur = 3;
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 1;

                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 16px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${percentage.toFixed(1)}%`, textX, textY);
                
                // Resetar sombra
                ctx.shadowColor = 'transparent';
            }

            startAngle += sliceAngle;
        });

        // Desenhar círculo interno (efeito donut - opcional)
        const innerRadius = radius * 0.5;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
        ctx.fill();

        // Total no centro
        ctx.fillStyle = '#212529';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(total, centerX, centerY - 8);
        
        ctx.fillStyle = '#6c757d';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText('pacientes', centerX, centerY + 12);
    }

    function desenharLegenda(containerId, dados) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        dados.forEach(item => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.innerHTML = `
                <div class="legend-color" style="background-color: ${item.color}"></div>
                <span class="legend-label">${item.label}</span>
                <span class="legend-value">${item.value}</span>
            `;
            container.appendChild(legendItem);
        });
    }

    // ===== GRÁFICO 4: CADASTRADOS VS VACINADOS =====
    async function carregarGraficoCadastradosVacinados() {
        try {
            // Buscar total de pessoas
            const responsePessoas = await fetch(`${API_BASE}/pessoa?size=1000&page=0`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!responsePessoas.ok) throw new Error('Erro ao carregar pessoas');

            const dataPessoas = await responsePessoas.json();
            let pessoas = [];
            
            if (Array.isArray(dataPessoas?.dados) && Array.isArray(dataPessoas.dados[0])) {
                pessoas = dataPessoas.dados[0];
            } else if (Array.isArray(dataPessoas?.dados)) {
                pessoas = dataPessoas.dados;
            }

            const totalCadastrados = pessoas.length;

            // Buscar vacinações
            const responseVacinacoes = await fetch(`${API_BASE}/vacinacoes?size=1000&page=0`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!responseVacinacoes.ok) throw new Error('Erro ao carregar vacinações');

            const dataVacinacoes = await responseVacinacoes.json();
            let vacinacoes = [];
            
            if (Array.isArray(dataVacinacoes?.dados) && Array.isArray(dataVacinacoes.dados[0])) {
                vacinacoes = dataVacinacoes.dados[0];
            } else if (Array.isArray(dataVacinacoes?.dados)) {
                vacinacoes = dataVacinacoes.dados;
            }

            // Contar pessoas únicas vacinadas
            const pessoasVacinadas = new Set();
            vacinacoes.forEach(v => {
                if (v.pessoa?.uuid) {
                    pessoasVacinadas.add(v.pessoa.uuid);
                }
            });

            const totalVacinados = pessoasVacinadas.size;

            desenharGraficoComparacao('graficoCadastradosVacinados', {
                cadastrados: totalCadastrados,
                vacinados: totalVacinados
            });

        } catch (error) {
            console.error('Erro ao carregar comparação:', error);
        }
    }

    function desenharGraficoComparacao(containerId, dados) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        const maxValue = Math.max(dados.cadastrados, dados.vacinados, 1);
        const percCadastrados = (dados.cadastrados / maxValue) * 100;
        const percVacinados = (dados.vacinados / maxValue) * 100;
        const percCobertura = dados.cadastrados > 0 ? ((dados.vacinados / dados.cadastrados) * 100).toFixed(1) : 0;

        container.innerHTML = `
            <div class="comparison-item">
                <div class="comparison-header">
                    <div class="comparison-label" style="color: #007BFF;">
                        <i class="fa-solid fa-users"></i>
                        Pessoas Cadastradas
                    </div>
                    <div class="comparison-value" style="color: #007BFF;">${dados.cadastrados.toLocaleString('pt-BR')}</div>
                </div>
                <div class="comparison-bar-wrapper">
                    <div class="comparison-bar cadastrados" style="width: 0%; animation: growBar 1.2s ease forwards;">
                        ${dados.cadastrados.toLocaleString('pt-BR')} pessoas
                    </div>
                </div>
            </div>

            <div class="comparison-item">
                <div class="comparison-header">
                    <div class="comparison-label" style="color: #28a745;">
                        <i class="fa-solid fa-syringe"></i>
                        Pessoas Vacinadas
                    </div>
                    <div class="comparison-value" style="color: #28a745;">${dados.vacinados.toLocaleString('pt-BR')}</div>
                </div>
                <div class="comparison-bar-wrapper">
                    <div class="comparison-bar vacinados" style="width: 0%; animation: growBar 1.2s ease forwards 0.2s;">
                        ${dados.vacinados.toLocaleString('pt-BR')} pessoas
                    </div>
                    <div class="comparison-percentage" style="opacity: 0; animation: fadeIn 0.5s ease forwards 1.4s;">
                        ${percCobertura}% de cobertura
                    </div>
                </div>
            </div>
        `;

        // Adicionar animações CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes growBar {
                from { width: 0%; }
                to { width: var(--target-width); }
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-5px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        if (!document.getElementById('comparison-animations')) {
            style.id = 'comparison-animations';
            document.head.appendChild(style);
        }

        // Animar as barras
        setTimeout(() => {
            const barCadastrados = container.querySelector('.comparison-bar.cadastrados');
            const barVacinados = container.querySelector('.comparison-bar.vacinados');
            
            if (barCadastrados) {
                barCadastrados.style.setProperty('--target-width', `${percCadastrados}%`);
                barCadastrados.style.width = `${percCadastrados}%`;
            }
            
            if (barVacinados) {
                barVacinados.style.setProperty('--target-width', `${percVacinados}%`);
                barVacinados.style.width = `${percVacinados}%`;
            }
        }, 100);
    }

    // ===== INICIALIZAR TODOS OS GRÁFICOS =====
    function inicializarGraficos() {
        console.log('📊 Carregando gráficos do dashboard...');
        carregarGraficoVacinacoesPeriodo();
        carregarGraficoTopVacinas();
        carregarGraficoFaixaEtaria();
        carregarGraficoCadastradosVacinados();
    }

    // Aguardar um pouco para garantir que a página carregou
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarGraficos);
    } else {
        setTimeout(inicializarGraficos, 500);
    }
})();
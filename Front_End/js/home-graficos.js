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
        const padding = 70;
        const paddingTop = 50;
        const paddingBottom = 60;
        const graphWidth = width - padding * 2;
        const graphHeight = height - paddingTop - paddingBottom;

        ctx.clearRect(0, 0, width, height);

        const maxValue = Math.max(...valores, 1);
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

            const value = Math.round(roundedMax - (roundedMax / numGridLines) * i);
            ctx.fillStyle = '#495057';
            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(value, padding - 15, y);
        }

        // Desenhar eixos principais
        ctx.strokeStyle = '#495057';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(padding, paddingTop);
        ctx.lineTo(padding, height - paddingBottom);
        ctx.lineTo(width - padding, height - paddingBottom);
        ctx.stroke();

        // Calcular pontos
        const stepX = graphWidth / (labels.length - 1 || 1);
        const points = [];

        valores.forEach((valor, index) => {
            const x = padding + stepX * index;
            const y = height - paddingBottom - ((valor - 0) / roundedMax) * graphHeight;
            points.push({ x, y, valor });
        });

        // Desenhar área preenchida com gradiente
        const gradient = ctx.createLinearGradient(0, paddingTop, 0, height - paddingBottom);
        gradient.addColorStop(0, 'rgba(0, 123, 255, 0.35)');
        gradient.addColorStop(1, 'rgba(0, 123, 255, 0.02)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(points[0].x, height - paddingBottom);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, height - paddingBottom);
        ctx.closePath();
        ctx.fill();

        // Desenhar linha suavizada
        ctx.strokeStyle = '#007BFF';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(0, 123, 255, 0.3)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 0; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Desenhar pontos com destaque
        points.forEach(p => {
            ctx.fillStyle = 'rgba(0, 123, 255, 0.15)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#007BFF';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.stroke();
        });

        // Labels do eixo X
        ctx.fillStyle = '#495057';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const labelStep = Math.ceil(labels.length / 8);
        labels.forEach((label, index) => {
            if (index % labelStep === 0 || index === labels.length - 1) {
                const x = padding + stepX * index;
                ctx.fillText(label, x, height - paddingBottom + 15);
            }
        });
    }

    // ===== GRÁFICO 2: TOP 5 VACINAS DOS ÚLTIMOS 30 DIAS - CORRIGIDO =====
    async function carregarGraficoTopVacinas() {
        const container = document.getElementById('graficoTopVacinas');
        
        try {
            // Mostrar loading
            if (container) {
                container.innerHTML = '<div class="loading-chart"><i class="fa-solid fa-spinner fa-spin"></i><p>Carregando...</p></div>';
            }

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

            console.log('📊 Total de vacinações carregadas:', vacinacoes.length);

            if (vacinacoes.length === 0) {
                if (container) {
                    container.innerHTML = '<div class="no-data-chart"><i class="fa-solid fa-chart-bar"></i><p>Nenhuma vacinação registrada</p></div>';
                }
                return;
            }

            // ✅ BUSCAR DETALHES DE CADA VACINAÇÃO (para pegar nome da vacina)
            console.log('🔍 Buscando detalhes das vacinações para obter nomes das vacinas...');
            const vacinacoesComDetalhes = [];
            
            for (const v of vacinacoes) {
                try {
                    const respDetalhe = await fetch(`${API_BASE}/vacinacoes/${v.uuid}`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    
                    if (respDetalhe.ok) {
                        const detalhe = await respDetalhe.json();
                        
                        let detalheDados = null;
                        if (Array.isArray(detalhe?.dados) && Array.isArray(detalhe.dados[0])) {
                            detalheDados = detalhe.dados[0][0];
                        } else if (Array.isArray(detalhe?.dados)) {
                            detalheDados = detalhe.dados[0];
                        } else if (detalhe?.dados) {
                            detalheDados = detalhe.dados;
                        } else {
                            detalheDados = detalhe;
                        }
                        
                        if (detalheDados) {
                            vacinacoesComDetalhes.push({
                                ...v,
                                vacinaDetalhada: detalheDados.vacina,
                                pessoaDetalhada: detalheDados.pessoa
                            });
                        }
                    }
                } catch (err) {
                    console.warn('⚠️ Erro ao buscar detalhe da vacinação:', err);
                }
            }

            console.log('📊 Vacinações com detalhes:', vacinacoesComDetalhes.length);

            // ✅ Filtrar últimos 30 dias
            const hoje = new Date();
            const dia30Atras = new Date(hoje);
            dia30Atras.setDate(hoje.getDate() - 30);

            const vacinacoesRecentes = vacinacoesComDetalhes.filter(v => {
                if (!v.dataAplicacao) return false;
                
                let dataStr = v.dataAplicacao;
                if (dataStr.includes('/')) {
                    const [dia, mes, ano] = dataStr.split('/');
                    dataStr = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
                }
                
                const dataVacinacao = new Date(dataStr);
                return dataVacinacao >= dia30Atras && dataVacinacao <= hoje;
            });

            console.log('📊 Vacinações nos últimos 30 dias:', vacinacoesRecentes.length);

            if (vacinacoesRecentes.length === 0) {
                if (container) {
                    container.innerHTML = '<div class="no-data-chart"><i class="fa-solid fa-chart-bar"></i><p>Nenhuma vacinação nos últimos 30 dias</p></div>';
                }
                return;
            }

            // ✅ Contar vacinas
            const contador = {};
            vacinacoesRecentes.forEach(v => {
                const nomeVacina = v.vacinaDetalhada?.nome || 'Não informado';
                contador[nomeVacina] = (contador[nomeVacina] || 0) + 1;
            });

            console.log('📊 Contador final:', contador);

            // Ordenar e pegar top 5
            const top5 = Object.entries(contador)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            console.log('🏆 Top 5 dos últimos 30 dias:', top5);

            desenharGraficoBarrasHorizontal('graficoTopVacinas', top5);

        } catch (error) {
            console.error('❌ Erro ao carregar top vacinas:', error);
            if (container) {
                container.innerHTML = '<div class="no-data-chart"><i class="fa-solid fa-exclamation-triangle"></i><p>Erro ao carregar dados</p></div>';
            }
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

        // Cores vibrantes e modernas
        const cores = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
        ];

        dados.forEach(([nome, valor], index) => {
            const percentage = (valor / maxValue) * 100;
            const cor = cores[index % cores.length];

            const barItem = document.createElement('div');
            barItem.className = 'bar-item';
            barItem.style.cssText = 'display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;';

            barItem.innerHTML = `
                <div class="bar-label" style="
                    min-width: 180px;
                    max-width: 180px;
                    font-size: 1rem;
                    color: #212529;
                    font-weight: 700;
                    text-align: right;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                " title="${nome}">${nome}</div>
                <div class="bar-wrapper" style="flex: 1; display: flex; align-items: center; gap: 0.75rem;">
                    <div class="bar-bg" style="
                        flex: 1;
                        height: 42px;
                        background-color: #f8f9fa;
                        border-radius: 12px;
                        overflow: hidden;
                        position: relative;
                        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
                    ">
                        <div class="bar-fill" style="
                            width: 0%;
                            height: 100%;
                            border-radius: 12px;
                            background: ${cor};
                            transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-size: 1rem;
                            font-weight: 800;
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                            position: relative;
                            overflow: hidden;
                        ">
                            <span style="
                                opacity: 0;
                                transition: opacity 0.5s ease;
                                transition-delay: 0.8s;
                                z-index: 2;
                                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                            ">${valor}</span>
                            <div style="
                                position: absolute;
                                top: 0;
                                left: 0;
                                right: 0;
                                height: 50%;
                                background: linear-gradient(180deg, rgba(255, 255, 255, 0.25), transparent);
                                border-radius: 12px 12px 0 0;
                            "></div>
                        </div>
                    </div>
                    <div class="bar-value" style="
                        min-width: 50px;
                        font-size: 1.1rem;
                        color: #212529;
                        font-weight: 800;
                        text-align: left;
                    ">${valor}</div>
                </div>
            `;

            container.appendChild(barItem);
            
            // Animar a barra após adicionar ao DOM
            setTimeout(() => {
                const barFill = barItem.querySelector('.bar-fill');
                const barText = barItem.querySelector('.bar-fill span');
                if (barFill) {
                    barFill.style.width = `${percentage}%`;
                    if (barText) {
                        setTimeout(() => {
                            barText.style.opacity = '1';
                        }, 800);
                    }
                }
            }, 100 + (index * 150));
        });
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
                { label: 'Crianças (0-12)', value: distribuicao['0-12'], color: '#667eea' },
                { label: 'Adolescentes (13-17)', value: distribuicao['13-17'], color: '#f093fb' },
                { label: 'Adultos (18-59)', value: distribuicao['18-59'], color: '#4facfe' },
                { label: 'Idosos (60+)', value: distribuicao['60+'], color: '#43e97b' }
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
        const radius = Math.min(centerX, centerY) - 35;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const total = dados.reduce((sum, d) => sum + d.value, 0);
        
        if (total === 0) {
            ctx.fillStyle = '#495057';
            ctx.font = 'bold 18px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Sem dados', centerX, centerY);
            return;
        }

        let startAngle = -Math.PI / 2;

        dados.forEach(item => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;

            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 4;

            ctx.fillStyle = item.color;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();

            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            ctx.stroke();

            const percentage = (item.value / total) * 100;
            if (percentage > 5) {
                const middleAngle = startAngle + sliceAngle / 2;
                const textX = centerX + (radius / 1.5) * Math.cos(middleAngle);
                const textY = centerY + (radius / 1.5) * Math.sin(middleAngle);

                ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 1;

                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 18px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${percentage.toFixed(1)}%`, textX, textY);
                
                ctx.shadowColor = 'transparent';
            }

            startAngle += sliceAngle;
        });

        const innerRadius = radius * 0.55;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#212529';
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(total, centerX, centerY - 10);
        
        ctx.fillStyle = '#6c757d';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText('pacientes', centerX, centerY + 15);
    }

    function desenharLegenda(containerId, dados) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        dados.forEach(item => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.style.cssText = 'display: flex; align-items: center; gap: 0.6rem;';
            legendItem.innerHTML = `
                <div class="legend-color" style="
                    width: 18px;
                    height: 18px;
                    border-radius: 5px;
                    background-color: ${item.color};
                    flex-shrink: 0;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                "></div>
                <span class="legend-label" style="
                    font-size: 0.9rem;
                    color: #6c757d;
                    font-weight: 500;
                ">${item.label}</span>
                <span class="legend-value" style="
                    font-weight: 700;
                    color: #212529;
                    margin-left: auto;
                    font-size: 1rem;
                ">${item.value}</span>
            `;
            container.appendChild(legendItem);
        });
    }

    // ===== GRÁFICO 4: CADASTRADOS VS VACINADOS =====
    async function carregarGraficoCadastradosVacinados() {
        try {
            console.log('📊 Iniciando carregamento do gráfico de comparação...');
            
            const responsePessoas = await fetch(`${API_BASE}/pessoa?size=1000&page=0`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!responsePessoas.ok) throw new Error('Erro ao carregar pessoas');

            const dataPessoas = await responsePessoas.json();
            console.log('📦 Resposta pessoas:', dataPessoas);
            
            let pessoas = [];
            
            if (Array.isArray(dataPessoas?.dados) && Array.isArray(dataPessoas.dados[0])) {
                pessoas = dataPessoas.dados[0];
            } else if (Array.isArray(dataPessoas?.dados)) {
                pessoas = dataPessoas.dados;
            }

            const totalCadastrados = pessoas.length;
            console.log('👥 Total de pessoas cadastradas:', totalCadastrados);

            const responseVacinacoes = await fetch(`${API_BASE}/vacinacoes?size=1000&page=0`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!responseVacinacoes.ok) throw new Error('Erro ao carregar vacinações');

            const dataVacinacoes = await responseVacinacoes.json();
            console.log('📦 Resposta vacinações:', dataVacinacoes);
            
            let vacinacoes = [];
            
            if (Array.isArray(dataVacinacoes?.dados) && Array.isArray(dataVacinacoes.dados[0])) {
                vacinacoes = dataVacinacoes.dados[0];
            } else if (Array.isArray(dataVacinacoes?.dados)) {
                vacinacoes = dataVacinacoes.dados;
            }

            console.log('💉 Total de registros de vacinação:', vacinacoes.length);
            console.log('📊 Amostra de vacinações:', vacinacoes.slice(0, 3));

            // ✅ CORREÇÃO: Contar pessoas únicas vacinadas
            const pessoasVacinadas = new Set();
            
            vacinacoes.forEach((v, index) => {
                // Tentar diferentes caminhos para o UUID da pessoa
                let pessoaUuid = null;
                
                if (v.pessoa && v.pessoa.uuid) {
                    pessoaUuid = v.pessoa.uuid;
                } else if (v.pessoaUuid) {
                    pessoaUuid = v.pessoaUuid;
                } else if (v.pessoa_uuid) {
                    pessoaUuid = v.pessoa_uuid;
                }
                
                if (pessoaUuid) {
                    pessoasVacinadas.add(pessoaUuid);
                    if (index < 5) {
                        console.log(`✅ Pessoa vacinada #${index + 1}: ${pessoaUuid}`);
                    }
                } else {
                    console.warn('⚠️ Vacinação sem UUID de pessoa:', v);
                }
            });

            const totalVacinados = pessoasVacinadas.size;

            console.log('📊 Total de pessoas ÚNICAS vacinadas:', totalVacinados);
            console.log('📊 Total cadastrados:', totalCadastrados);
            console.log('📊 Pessoas vacinadas (Set):', Array.from(pessoasVacinadas).slice(0, 5));

            // Se não encontrou nenhuma pessoa vacinada, fazer uma busca mais detalhada
            if (totalVacinados === 0 && vacinacoes.length > 0) {
                console.warn('⚠️ Nenhuma pessoa vacinada encontrada. Buscando detalhes...');
                
                // Tentar buscar os detalhes de cada vacinação
                for (let i = 0; i < Math.min(vacinacoes.length, 5); i++) {
                    const v = vacinacoes[i];
                    if (v.uuid) {
                        try {
                            const respDetalhe = await fetch(`${API_BASE}/vacinacoes/${v.uuid}`, {
                                headers: { "Authorization": `Bearer ${token}` }
                            });
                            
                            if (respDetalhe.ok) {
                                const detalhe = await respDetalhe.json();
                                console.log(`🔍 Detalhe vacinação #${i + 1}:`, detalhe);
                                
                                let detalheDados = null;
                                if (Array.isArray(detalhe?.dados) && Array.isArray(detalhe.dados[0])) {
                                    detalheDados = detalhe.dados[0][0];
                                } else if (Array.isArray(detalhe?.dados)) {
                                    detalheDados = detalhe.dados[0];
                                } else if (detalhe?.dados) {
                                    detalheDados = detalhe.dados;
                                } else {
                                    detalheDados = detalhe;
                                }
                                
                                if (detalheDados && detalheDados.pessoa && detalheDados.pessoa.uuid) {
                                    pessoasVacinadas.add(detalheDados.pessoa.uuid);
                                    console.log(`✅ Pessoa encontrada via detalhe: ${detalheDados.pessoa.uuid}`);
                                }
                            }
                        } catch (err) {
                            console.error('Erro ao buscar detalhe:', err);
                        }
                    }
                }
            }

            const totalVacinadosFinal = pessoasVacinadas.size;
            console.log('📊 Total FINAL de pessoas vacinadas:', totalVacinadosFinal);

            desenharGraficoComparacao('graficoCadastradosVacinados', {
                cadastrados: totalCadastrados,
                vacinados: totalVacinadosFinal
            });

        } catch (error) {
            console.error('❌ Erro ao carregar comparação:', error);
            const container = document.getElementById('graficoCadastradosVacinados');
            if (container) {
                container.innerHTML = '<div class="no-data-chart"><i class="fa-solid fa-exclamation-triangle"></i><p>Erro ao carregar dados</p></div>';
            }
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
            <div class="comparison-item" style="margin-bottom: 3rem;">
                <div class="comparison-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem;">
                    <div class="comparison-label" style="
                        font-size: 1.15rem;
                        font-weight: 800;
                        color: #007BFF;
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                    ">
                        <i class="fa-solid fa-users" style="font-size: 1.5rem;"></i>
                        Pessoas Cadastradas
                    </div>
                    <div class="comparison-value" style="
                        font-size: 2.2rem;
                        font-weight: 900;
                        color: #007BFF;
                        letter-spacing: -0.5px;
                    ">${dados.cadastrados.toLocaleString('pt-BR')}</div>
                </div>
                <div class="comparison-bar-wrapper" style="
                        position: relative;
                        height: 55px;
                        background-color: #f8f9fa;
                        border-radius: 14px;
                        overflow: visible;
                        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
                    ">
                    <div class="comparison-bar cadastrados" style="
                        width: 0%;
                        height: 100%;
                        border-radius: 14px;
                        transition: width 1.4s cubic-bezier(0.4, 0, 0.2, 1);
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        display: flex;
                        align-items: center;
                        padding: 0 1.5rem;
                        color: white;
                        font-weight: 800;
                        font-size: 1.05rem;
                        position: relative;
                        box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
                        overflow: hidden;
                    ">
                        <span style="z-index: 2; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">${dados.cadastrados.toLocaleString('pt-BR')} pessoas</span>
                        <div style="
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            height: 50%;
                            background: linear-gradient(180deg, rgba(255, 255, 255, 0.25), transparent);
                            border-radius: 14px 14px 0 0;
                        "></div>
                    </div>
                </div>
            </div>

                <div class="comparison-item">
                <div class="comparison-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem;">
                    <div class="comparison-label" style="
                        font-size: 1.15rem;
                        font-weight: 800;
                        color: #28a745;
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                    ">
                        <i class="fa-solid fa-syringe" style="font-size: 1.5rem;"></i>
                        Pessoas Vacinadas
                    </div>
                    <div class="comparison-value" style="
                        font-size: 2.2rem;
                        font-weight: 900;
                        color: #28a745;
                        letter-spacing: -0.5px;
                    ">${dados.vacinados.toLocaleString('pt-BR')}</div>
                </div>
                <div class="comparison-bar-row" style="display: flex; align-items: center; gap: 1rem;">
                    <div class="comparison-bar-wrapper" style="
                        flex: 1;
                        position: relative;
                        height: 55px;
                        background-color: #f8f9fa;
                        border-radius: 14px;
                        overflow: visible;
                        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
                    ">
                        <div class="comparison-bar vacinados" style="
                            width: 0%;
                            height: 100%;
                            border-radius: 14px;
                            transition: width 1.4s cubic-bezier(0.4, 0, 0.2, 1);
                            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
                            display: flex;
                            align-items: center;
                            padding: 0 1.5rem;
                            color: white;
                            font-weight: 800;
                            font-size: 1.05rem;
                            position: relative;
                            box-shadow: 0 4px 16px rgba(67, 233, 123, 0.4);
                            overflow: hidden;
                        ">
                            <span style="z-index: 2; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">${dados.vacinados.toLocaleString('pt-BR')} pessoas</span>
                            <div style="
                                position: absolute;
                                top: 0;
                                left: 0;
                                right: 0;
                                height: 50%;
                                background: linear-gradient(180deg, rgba(255, 255, 255, 0.25), transparent);
                                border-radius: 14px 14px 0 0;
                            "></div>
                        </div>
                    </div>
                    <div class="comparison-percentage" style="
                        font-weight: 800;
                        color: #212529;
                        font-size: 1.05rem;
                        background: white;
                        padding: 0.5rem 1rem;
                        border-radius: 25px;
                        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
                        opacity: 0;
                        transition: opacity 0.6s ease;
                        transition-delay: 1.4s;
                        z-index: 5;
                    ">${percCobertura}% de cobertura</div>
                </div>
            </div>
        `;

        // Animar as barras
        setTimeout(() => {
            const barCadastrados = container.querySelector('.comparison-bar.cadastrados');
            const barVacinados = container.querySelector('.comparison-bar.vacinados');
            const badge = container.querySelector('.comparison-percentage');
            
            if (barCadastrados) {
                barCadastrados.style.width = `${percCadastrados}%`;
            }
            
            setTimeout(() => {
                if (barVacinados) {
                    barVacinados.style.width = `${percVacinados}%`;
                }
                if (badge) {
                    setTimeout(() => {
                        badge.style.opacity = '1';
                    }, 1400);
                }
            }, 300);
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarGraficos);
    } else {
        setTimeout(inicializarGraficos, 500);
    }
})();
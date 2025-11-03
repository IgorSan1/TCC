document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'http://localhost:8080/api/v1';
    const form = document.getElementById('form-cadastrar-vacina');
    const fabricanteSelect = document.getElementById('fabricante');

    // Populando o select de fabricantes
    const fabricantes = [
        { value: '', text: 'Selecione o fabricante' },
        { value: 'PFIZER_BIONTECH', text: 'Pfizer Biontech' },
        { value: 'ASTRAZENECA_FIOCRUZ', text: 'AstraZeneca Fiocruz' },
        { value: 'SINOVAC_BUTANTAN', text: 'Sinovac Butantan' },
        { value: 'JANSSEN', text: 'Janssen' },
        { value: 'MODERNA', text: 'Moderna' },
        { value: 'SERUM_INSTITUTE', text: 'Serum Institute of India' },
        { value: 'SANOFI_PASTEUR', text: 'Sanofi Pasteur' },
        { value: 'GLAXOSMITHKLINE', text: 'GlaxoSmithKline' },
        { value: 'MERCK_SHARP_DOHME', text: 'Merck Sharp & Dohme' }
    ];

    fabricantes.forEach(f => {
        const option = document.createElement('option');
        option.value = f.value;
        option.textContent = f.text;
        fabricanteSelect.appendChild(option);
    });

    // Botão cancelar
    const btnCancelar = document.querySelector('.btn-secondary');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            window.location.href = 'home.html';
        });
    }

    // Submissão do formulário
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.getElementById('nome-vacina').value.trim();
        const numeroLote = document.getElementById('lote').value.trim();
        const fabricante = document.getElementById('fabricante').value;
        const fabricacao = document.getElementById('fabricacao').value; // yyyy-MM-dd
        const validade = document.getElementById('validade').value; // yyyy-MM-dd

        // Validações básicas
        if (!nome || !numeroLote || !fabricante || !fabricacao || !validade) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        // Converter datas de yyyy-MM-dd para dd/MM/yyyy
        const partesFabricacao = fabricacao.split('-');
        const dataFabricacao = `${partesFabricacao[2]}/${partesFabricacao[1]}/${partesFabricacao[0]}`;

        const partesValidade = validade.split('-');
        const dataValidade = `${partesValidade[2]}/${partesValidade[1]}/${partesValidade[0]}`;

        const payload = {
            nome,
            numeroLote,
            dataFabricacao,
            dataValidade,
            fabricante
        };

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Você precisa estar logado para cadastrar uma vacina.');
                window.location.href = 'login.html';
                return;
            }

            console.log('Enviando vacina payload:', payload);
            const response = await fetch(`${API_BASE}/vacina`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.mensagem || 'Vacina cadastrada com sucesso!');
                form.reset();
                window.location.href = 'home.html';
            } else {
                const errorData = await response.json().catch(() => ({ mensagem: response.statusText }));
                alert(`Erro ao cadastrar vacina: ${errorData.mensagem}`);
            }
        } catch (err) {
            console.error('Erro:', err);
            alert('Falha de comunicação com o servidor.');
        }
    });
});


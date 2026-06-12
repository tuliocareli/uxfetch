require('dotenv').config();
const { sendDailyEmail } = require('./utils/mailer');

async function testEmail() {
    const user = { email: 'tctulio2009@hotmail.com' };
    const mockJobs = [
        {
            is_remote: true,
            title: 'Senior Product Designer',
            company: 'Nubank',
            location: 'Remoto',
            description: 'Essa é uma vaga inédita. Estamos buscando um Senior Product Designer para liderar a evolução da experiência.',
            url: 'https://uxfetch.com.br'
        }
    ];

    const mockRecentJobs = [
        {
            is_remote: false,
            title: 'UX/UI Designer Pleno',
            company: 'Mercado Livre',
            location: 'São Paulo, SP',
            url: 'https://uxfetch.com.br/ml'
        },
        {
            is_remote: true,
            title: 'Product Researcher',
            company: 'PicPay',
            location: 'Remoto',
            url: 'https://uxfetch.com.br/picpay'
        }
    ];

    console.log(`Enviando e-mail de teste com seção recente para ${user.email}...`);
    await sendDailyEmail(user, mockJobs, mockRecentJobs);
    console.log('Script finalizado.');
}

testEmail();

const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Client :: ready');
    conn.exec(`psql "postgresql://postgres:Password123@localhost:5432/tuga_backend" -c "
      SELECT u.email, tm.\\"totalMatchedJobs\\", tm.\\"responseRate\\"
      FROM \\"User\\" u 
      LEFT JOIN \\"TraderMetrics\\" tm ON u.id = tm.\\"traderId\\"
      WHERE u.email IN ('jay_dossantos@outlook.com')
    "`, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
            conn.end();
        }).on('data', (data) => {
            console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
            console.log('STDERR: ' + data);
        });
    });
}).connect({
    host: '178.16.137.54',
    port: 22,
    username: 'root',
    password: 'Savotech@1234'
});

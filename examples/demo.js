const { Scale } = require('../lib');

(async () => {
    const scale = new Scale({ port: 'COM3', autoRestart: true });

    scale.on('response', txt    => console.log('Resp:', txt));
    scale.on('errorCode', (c,d) => console.log(`Err ${c}: ${d}`));
    scale.on('sent',    (c,p)   => console.log(`Sent ${c}${p}`));
    scale.on('closed',  ()      => console.log('Port closed'));
    scale.on('restarted',()     => console.log('Port reopened'));

    await scale.open();
    // scale.send('SZ');   // set scale zero
    scale.send('RN');   // read scale
})();

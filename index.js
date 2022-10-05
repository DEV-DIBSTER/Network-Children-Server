const ExpressJS = require('express');
const OS = require('os');
const fs = require('fs');
const SI = require('systeminformation');
const PrettySizeJS = require('prettysize');
const BodyParser = require('body-parser');
const Axios = require('axios');

const Configuration = require('./config.json');
const Exec = require('child_process').exec;

const Server = ExpressJS();
Server.set('json spaces', 2);
Server.use(BodyParser.json(), BodyParser.urlencoded({extended: true}));

Server.get('/', async (Request, Response) => {
    Response.status(404).send('Nothing to see here!');
});

Server.get('/online', async (Request, Response) => {
    const TimeElapsed = new Date();
    const Today = new Date(TimeElapsed);
    
    const Data = {
        Online: true,
        Time: `[${Today.toLocaleDateString()}] (${Today.getHours()}:${Today.getMinutes()}:${Today.getSeconds()})`,
        FullTime: `${TimeElapsed}`,
        EpochTime: Math.round(Date.now()/1000)
    };
    
    Response.status(200).send(Data);
});

Server.get('/stats', async (Request, Response) => {
    if(Request.headers.password != Configuration.InComing_Password) return Response.status(403).send('Invalid Authentication.');

    await Response.status(200).send(await GetServerStats());
});

async function GetServerStats(){
    const Memory = await SI.mem();
    const CPU = await SI.cpu();
    const Disk = await SI.fsSize();

    const ResponseData = {
        //Memory Information.
        TotalMemory: PrettySizeJS(Memory.total),
        FreeMemory: PrettySizeJS(Memory.free),
        UsedMemory: PrettySizeJS(Memory.used),
        SwapTotal: PrettySizeJS(Memory.swaptotal),
        SwapFree: PrettySizeJS(Memory.swapfree),
        SwapUsed: PrettySizeJS(Memory.swapused),

        TotalMemoryRaw: Memory.total,
        FreeMemoryRaw: Memory.free,
        UsedMemoryRaw: Memory.used,
        SwapTotalRaw: Memory.swaptotal,
        SwapFreeRaw: Memory.swapfree,
        SwapUsedRaw: Memory.swapused,

        //Disk Information.
        TotalDisk: PrettySizeJS(Disk[0].size),
        FreeDisk: PrettySizeJS(Disk[0].available),
        UsedDisk: PrettySizeJS(Math.round(Disk[0].size - Disk[0].available)),

        TotalDiskRaw: Disk[0].size,
        FreeDiskRaw: Disk[0].available,
        UsedDiskRaw: Disk[0].size - Disk[0].available,
        
        //CPU Information.
        Cpu: CPU.manufacturer + "" + CPU.brand,
        CpuThreads: CPU.cores,
        CpuCores: CPU.physicalCores,

        //Operating System Information.
        Uptime: OS.uptime(),
        ServerName: OS.hostname(),

        //Misc Information.
        UpdatedTime: Math.floor(Date.now()/1000)
    };

    return ResponseData;
};

async function SendData(){
    const Data = await GetServerStats();

    await Axios({
        url: `https://${Configuration.Domain}/stats`,
        method: 'POST',
        headers: {
            'password': `${Configuration.Outgoing_Password}`,
            'Content-Type': 'application/json'
        },
        data: Data
    }).then(Response => {
        console.log(`[Server] | (${Response.status}) Data updated to parent server.`);
    }).catch(Error => {
        console.log(Error);
    });
};

;(async () => {
    await SendData();
})();

setInterval(async () => {
    await SendData();
}, 5 * 60 * 1000);

Server.listen(Configuration.Port, function () {
    console.log('-----------------------------------------------------------\n██████╗░██╗██████╗░░██████╗████████╗███████╗██████╗░\n██╔══██╗██║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗\n██║░░██║██║██████╦╝╚█████╗░░░░██║░░░█████╗░░██████╔╝\n██║░░██║██║██╔══██╗░╚═══██╗░░░██║░░░██╔══╝░░██╔══██╗\n██████╔╝██║██████╦╝██████╔╝░░░██║░░░███████╗██║░░██║\n╚═════╝░╚═╝╚═════╝░╚═════╝░░░░╚═╝░░░╚══════╝╚═╝░░╚═╝\n-----------------------------------------------------------');    
    console.log(`[Server] | Server is online at: ${Configuration.URL} at port ${Configuration.Port}!`);
});
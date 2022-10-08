async function GetTime(){
    const TimeElapsed = new Date();
    const Today = new Date(TimeElapsed);
    
    const Data = {
        Online: true,
        Time: `[${Today.toLocaleDateString()}] (${Today.getHours()}:${Today.getMinutes()}:${Today.getSeconds()})`,
        FullTime: `${TimeElapsed}`,
        EpochTime: Math.round(Date.now()/1000)
    };

    return Data;
};

module.exports = { GetTime };
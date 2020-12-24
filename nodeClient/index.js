//The node program that captures local performance data and sends it to the socket.io server

const os = require('os');
const io = require('socket.io-client');
let socket = io('http://127.0.0.1:8181');

socket.on('connect',()=>{
    //console.log('I am connected to the socket server ');
    //we need a way to identify this machine to whomever concerned.

    const nI = os.networkInterfaces();
    let macA;
    //loop through all the nI for this machine and find a non-internal one.
    for (let key in nI){
        if (!nI[key][0].internal){
            macA = nI[key][0].mac;
            break;
        }
    }
    //client auth with single key value
    socket.emit('clientAuth','4324jljljfsdkfj');

    performanceData().then((allPerformanceData)=>{
        allPerformanceData.macA = macA
        socket.emit('initPerfData',allPerformanceData);
    });

    //start sending data on interval

    let perfDataInterval = setInterval(()=>{
        performanceData().then((allPerformanceData)=>{
            allPerformanceData.macA = macA;
            socket.emit('perfData',allPerformanceData)
        })
    },1000)

    socket.on('disconnect',()=>{
        clearInterval(perfDataInterval);
    })

})
const osType = os.type();
function performanceData(){
    return new Promise(async(resolve,reject)=>{
        const cpus = os.cpus();
        const freeMem = os.freemem();
        const totalMem = os.totalmem();
        const usedMem = totalMem - freeMem;
        const memUseage = Math.floor(usedMem/totalMem * 100)/100
        console.log(osType);
        const upTime = os.uptime();
        console.log(upTime);
        //number of cores
        const numCores = cpus.length;
        const cpuModel = cpus[0].model;
        const cpuSpeed = cpus[0].speed;
        const cpuLoad = await getCpuLoad();
        resolve({freeMem,totalMem,usedMem,memUseage,osType,upTime,cpuModel,numCores,cpuSpeed,cpuLoad})
    })
    
}

//cpus = all the cores. we need the average of all the cores which gives us cpu average
function cpuAverage(){
    const cpus = os.cpus();
    //get ms in each mode, this number is since the last reboot
    //get it now and then in 100ms and compare
    let idleMs = 0;
    let totalMs = 0;
    //loop through each core
    cpus.forEach((aCore)=>{
        for (type in aCore.times){
            totalMs += aCore.times[type];
        }
        idleMs += aCore.times.idle;
    })
    return {
        idle: idleMs/cpus.length,
        total: totalMs/cpus.length
    }
}

// let x = cpuAverage();
// console.log(x);

//because the times property is since last boot get the current times as well as 100 ms 
// from now times. Compare these 2, that will give the current load
function getCpuLoad(){
    return new Promise((resolve,reject)=>{
        const start = cpuAverage();
        setTimeout(()=>{
        const end = cpuAverage();
        const idleDifference = end.idle - start.idle;
        const totalDifference = end.total - start.total;
        //console.log(idleDifference,totalDifference);
        //calc percentage of used cpu
        const percentageCpu = 100 - Math.floor(100 * idleDifference/totalDifference)
        resolve(percentageCpu);
    },100)
    })
}

performanceData().then((allPerformanceData)=>{
    console.log(allPerformanceData)
})




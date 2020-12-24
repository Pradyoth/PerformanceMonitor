//entry point for our cluster which will create workers
//workers will take care of socket.io handling

const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1/perfData', {useNewUrlParser:true})
const Machine = require('./models/Machine');
function socketMain(io,socket){
    let macA;
    console.log('A socket connected ', socket.id);

    socket.on('clientAuth',(key)=>{

        if (key === '4324jljljfsdkfj'){
            //valid node client
            socket.join('clients');
        }
        else if (key === 'uifdsjfksj'){
            //valid ui client has joined
            socket.join('ui');
            console.log('a react client has joined');
        }
        else {
            socket.disconnect(true);
        }
    })

    //A machine has connected, check to see if it's new 
    // if it is, add it

    socket.on('initPerfData', async(data)=>{
        // console.log(data);
        //update our socket function scoped variable
        macA = data.macA;
        //now go check mongo
        const mongooseResponse = await checkAndAdd(data)
        console.log(mongooseResponse);
    })
    socket.on('perfData',(data)=>{
        console.log('tick..');
        io.to('ui').emit('data',data);
    });
    // console.log('Someone called me! i am socket main')
}

function checkAndAdd(data){
    return new Promise((resolve,reject)=>{

        Machine.findOne(
            {macA:data.macA},
            (err,doc)=>{
                if (err){
                    throw error;
                    reject(err);
                }
                else if (doc === null){
                    //the record is not in the database, so add the record.
                    let newMachine = new Machine(data);
                    newMachine.save();
                    resolve('added');
                }
                else {
                    //it is in the database, just resolve.
                    resolve('found');
                }
            }
        )
    })
}

module.exports = socketMain;
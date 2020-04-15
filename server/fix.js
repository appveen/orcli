const buildsModel = require('./models/builds.model');


const arr = [];
buildsModel.find({
    select: '_id,status',
    filter: { status: 'Processing' }
}).then(docs => {
    arr.push(buildsModel.findByIdAndUpdate(docs._id, { status: 'Success' }));
});

Promise.all(arr).then(allStatus => {
    console.log(allStatus);
}).catch(err => {
    console.error(err);
})
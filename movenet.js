

const fs = require('fs');
const path = require('path');
const process = require('process');
const log = require('@vladmandic/pilogger');
const tf = require('@tensorflow/tfjs-node');
const canvas = require('canvas');
const createCsvWirter = require('csv-writer').createObjectCsvWriter;
const { pow } = require('@tensorflow/tfjs-node');


//angle data init
const txtHeader = ['num', 'ang1', 'ang2', 'ang3', 'ang4', 'ang5', 'ang6', 'ang7', 'ang8', 'label'];
  const csvWriterHeader = txtHeader.map((el) => {
    return {  id: el, title: el };
  });

//model list
const modelOptions = {
   modelPath: 'file://model-lightning3/movenet-lightning.json',
  //modelPath: 'file://model-lightning4/movenet-lightning.json',
  // modelPath: 'file://model-thunder3/movenet-thunder.json',
  // modelPath: 'file://model-thunder4/movenet-thunder.json',
};

const bodyParts = ['nose', 'leftEye', 'rightEye', 'leftEar', 'rightEar', 'leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist', 'leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'];

//save joint results to csv file
async function saveCSV(res){

  var a = "";

  //jquery 활용
  //convert results to csvString
  $(res).each(function(idx,value){
    a += value.label + "," + item.x + "," + item.y + "\r\n";
  });
  a += "\n";

  //convert to csv file
  const fileName = "test.csv";
  var csvContent = "data:text/csv'charset=utf-8" ;
  var blob = new Blob(["\uFEFF"+csv], {type: 'text/csv; charset=utf-8'});
  
  // write canvas to jpeg
  /*const outImage = `outputs/${path.basename(img.fileName)}`;
  const out = fs.createWriteStream(outImage);
  out.on('finish', () => log.state('Created output image:', outImage, 'size:', [c.width, c.height]));
  out.on('error', (err) => log.error('Error creating image:', outImage, err));
  const stream = c.createJPEGStream({ quality: 0.6, progressive: true, chromaSubsampling: true });
  stream.pipe(out);
  */

   // (D) FILE HANDLER & FILE STREAM
   const fileHandle = await window.showSaveFilePicker({
    suggestedName : "demo.csv",
    types: [{
      description: "CSV file",
      accept: {"text/csv": [".csv"]}
    }]
  });
  const fileStream = await fileHandle.createWritable();
 
  // (E) WRITE FILE
  await fileStream.write(myBlob);
  await fileStream.close();


} 


// save image with processed results
async function saveImage(res, img) {
  // create canvas
  const c = new canvas.Canvas(img.inputShape[1], img.inputShape[0]);
  const ctx = c.getContext('2d');

  // load and draw original image
  const original = await canvas.loadImage(img.fileName);
  ctx.drawImage(original, 0, 0, c.width, c.height);
  // const fontSize = Math.trunc(c.width / 50);
  const fontSize = Math.round((c.width * c.height) ** (1 / 2) / 80);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'white';
  ctx.font = `${fontSize}px "Segoe UI"`;

  // draw all detected objects
  for (const obj of res) {
    ctx.fillStyle = 'black';
    ctx.fillText(`${Math.round(100 * obj.score)}% ${obj.label}`, obj.x + 1, obj.y + 1);
    ctx.fillStyle = 'white';
    ctx.fillText(`${Math.round(100 * obj.score)}% ${obj.label}`, obj.x, obj.y);
  }
  ctx.stroke();

  const connectParts = (parts, color) => {
    ctx.strokeStyle = color;
    ctx.beginPath();
    for (let i = 0; i < parts.length; i++) {
      const part = res.find((a) => a.label === parts[i]);
      if (part) {
        if (i === 0) ctx.moveTo(part.x, part.y);
        else ctx.lineTo(part.x, part.y);
      }
    }
    ctx.stroke();
  };

  connectParts(['nose', 'leftEye', 'rightEye', 'nose'], '#99FFFF');
  connectParts(['rightShoulder', 'rightElbow', 'rightWrist'], '#99CCFF');
  connectParts(['leftShoulder', 'leftElbow', 'leftWrist'], '#99CCFF');
  connectParts(['rightHip', 'rightKnee', 'rightAnkle'], '#9999FF');
  connectParts(['leftHip', 'leftKnee', 'leftAnkle'], '#9999FF');
  connectParts(['rightShoulder', 'leftShoulder', 'leftHip', 'rightHip', 'rightShoulder'], '#9900FF');

  // write canvas to jpeg
  const outImage = `outputs/${path.basename(img.fileName)}`;
  const out = fs.createWriteStream(outImage);
  out.on('finish', () => log.state('Created output image:', outImage, 'size:', [c.width, c.height]));
  out.on('error', (err) => log.error('Error creating image:', outImage, err));
  const stream = c.createJPEGStream({ quality: 0.6, progressive: true, chromaSubsampling: true });
  stream.pipe(out);
}

// load image from file and prepares image tensor that fits the model
async function loadImage(fileName, inputSize) {
  const data = fs.readFileSync(fileName);
  const obj = tf.tidy(() => {
    const buffer = tf.node.decodeImage(data);
    const expand = buffer.expandDims(0);
    // @ts-ignore
    const resize = tf.image.resizeBilinear(expand, [inputSize, inputSize]);
    const cast = tf.cast(resize, 'int32');
    const tensor = cast;
    const img = { fileName, tensor, inputShape: buffer.shape, modelShape: tensor.shape, size: buffer.size };
    return img;
  });
  return obj;
}

//output
async function processResults(res, img) {
  const data = res.arraySync();
  log.info('Tensor output', res.shape);
  // log.data(data);
  res.dispose();
  const kpt = data[0][0];
  const parts = [];
  for (let i = 0; i < kpt.length; i++) {
    const part = {
      id: i,
      label: bodyParts[i],
      score: kpt[i][2],
      xRaw: kpt[i][0],
      yRaw: kpt[i][1],
      x: Math.trunc(kpt[i][1] * img.inputShape[1]),
      y: Math.trunc(kpt[i][0] * img.inputShape[0]),
    };
    parts.push(part);
  }
  return parts;
}

 function ComputeAngle(a,b,c){
  /*
  var o1 = Math.atan((array[7].y - array[5].y) / (array[7].x - array[5].x));
  var o2 = Math.atan((array[11].y - array[5].y) / (array[11].x - array[5].x));
  var ang1 = 180 - (o1-o2) * 180/Math.PI;
  */

  var aa = Math.sqrt(Math.pow(a.x -c.x,2) + Math.pow(a.y - c.y ,2));
  var bb = Math.sqrt(Math.pow(a.x -b.x,2) + Math.pow(a.y - b.y ,2));
  var cc = Math.sqrt(Math.pow(b.x -c.x,2) + Math.pow(b.y - c.y ,2));

  temp = (Math.pow(bb,2) + Math.pow(cc,2) - Math.pow(aa,2)) / (2*bb*cc);

  var ang = Math.acos(temp);

  ang = ang*(180/Math.PI);
  log.info('angle :', ang);
  return ang;
}

// compute angle between three dots
function getAngle(idx, array){

/*
  //original computation code
  var o1 = Math.atan((p1.y-p2.y),(p1.x-p2.x));
  var o2 = Math.atan((p2.y-p3.y)/(p2.x-p3.x));
  
  var ang1 = (o1-o2) * 180/Math.PI;
  log.info('angle computation result :', ang1);
*/
  
  let angles = { num : idx, 
  ang1 : '', ang2 : '', ang3 : '', ang4 : '',  
  ang5 : '', ang6 : '', ang7 : '', ang8 : '', label : '', 
  };
  
  
  //angle 1 - right elow [8], right shoulder [6], right hip [12]
  angles.ang1 = ComputeAngle(array[8],array[6],array[12]);

  //angle 2 - left elow[7], left shoulder[5], left hip[11]                                                                           
  angles.ang2 = ComputeAngle(array[7],array[5],array[11]);

  //angle 3 - right shoulder[6], right elow[8], right wrist[10]
  angles.ang3 = ComputeAngle(array[6],array[8],array[10]);

  //angle 4 - left shoulder[5], left elow[7], left wrist[9]
  angles.ang4 = ComputeAngle(array[5],array[7],array[9]);

  //angle 5 - left hip[11], right hip[12], right knee[14]
  angles.ang5 = ComputeAngle(array[11],array[12],array[14]);

  //angle 6 - right hip[12], left hip[11], left knee[13]
  angles.ang6 = ComputeAngle(array[12],array[11],array[13]);

  //angle 7 - right hip[12], right knee[14] right ankle[16] 
  angles.ang7 = ComputeAngle(array[12],array[14],array[16]);

  //angle 8 - left hip[11], left knee[13], left ankle[15]
  angles.ang8 = ComputeAngle(array[11],array[13],array[15]);

  //debug
  //log.info('return result', angles);
  
  return angles;

}

// main 
async function main() {
  log.header();

  // init tensorflow
  await tf.enableProdMode();
  await tf.setBackend('tensorflow');
  await tf.ENV.set('DEBUG', false);
  await tf.ready();

  // load model
  const model = await tf.loadGraphModel(modelOptions.modelPath);
  log.info('Loaded model', modelOptions, 'tensors:', tf.engine().memory().numTensors, 'bytes:', tf.engine().memory().numBytes);
  // @ts-ignore
  log.info('Model Signature', model.signature);

  // load image and get approprite tensor for it
  let inputSize = Object.values(model.modelSignature['inputs'])[0].tensorShape.dim[2].size;
  if (inputSize === -1) inputSize = 256;

/*
  const imageFile = process.argv.length > 2 ? process.argv[2] : null;
  if (!imageFile || !fs.existsSync(imageFile)) {
    log.error('Specify a valid image file');
    process.exit();
  }
*/
  

  //save csv 
  //init
  

  let result = [];
  
  //data extraction
  for( i = 1; i < 2; i++){
    const imageFile = "data/data"+ i +".jpg";
    const img = await loadImage(imageFile, inputSize);
    log.info('Loaded image:', img.fileName, 'inputShape:', img.inputShape, 'modelShape:', img.modelShape, 'decoded size:', img.size);

    // run actual prediction
    const t0 = process.hrtime.bigint();
    // for (let i = 0; i < 99; i++) model.execute(img.tensor); // benchmarking

    const res = model.execute(img.tensor);
    const t1 = process.hrtime.bigint();
    log.info('Inference time:', Math.round(parseInt((t1 - t0).toString()) / 1000 / 1000), 'ms');

    // process results
    const results = await processResults(res, img);

    //const t2 = process.hrtime.bigint();
    //log.info('Processing time:', Math.round(parseInt((t2 - t1).toString()) / 1000 / 1000), 'ms');

    // print results
    //log.data('Results:', results);
  
    //joint 값을 활용하여 8개의 앵글 값 추출
    let data = await getAngle(i, results);
    result.push(data);

    //save result image
    //to compare exact location of joint from each skeleton data
    await saveImage(results, img);
  }
  
  //save csv file 
  const csvWriter = createCsvWirter({
    path: 'csv-writer.csv', 
    header: csvWriterHeader,
  });

  csvWriter.writeRecords(result).then(() => {
    console.log('done!');
  });



}

main();

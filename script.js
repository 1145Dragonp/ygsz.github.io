let effectLevel = 1; // 默认效果等级

document.getElementById('settingsButton').addEventListener('click', showSettings);
document.getElementById('processButton').addEventListener('click', processAudio);
document.getElementById('downloadButton').addEventListener('click', downloadAudio);

let processedAudioBlob;

function showSettings() {
  const level = prompt("选择音质效果等级（1到5）：", "1");
  if (level && !isNaN(level) && level >= 1 && level <= 5) {
    effectLevel = parseInt(level);
    alert(`已选择效果等级：${effectLevel}`);
  } else {
    alert("请输入有效的等级（1到5）！");
  }
}

async function processAudio() {
  const fileInput = document.getElementById('audioUpload');
  const file = fileInput.files[0];
  if (!file) {
    alert('请先上传音频文件！');
    return;
  }

  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // 根据效果等级处理音频
  let processedBuffer;
  switch (effectLevel) {
    case 1:
    case 2:
    case 3:
      processedBuffer = compressAudio(audioBuffer, effectLevel);
      break;
    case 4:
    case 5:
      processedBuffer = compressAndDistortAudio(audioBuffer, effectLevel);
      break;
    default:
      processedBuffer = audioBuffer; // 默认不处理
  }

  // 转换为Blob并设置下载按钮
  const processedArrayBuffer = processedBuffer.getChannelData(0).buffer;
  processedAudioBlob = new Blob([processedArrayBuffer], { type: 'audio/wav' });
  document.getElementById('downloadButton').disabled = false;
}

function compressAudio(audioBuffer, level) {
  // 模拟压缩到指定比特率
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  const channelData = audioBuffer.getChannelData(0);

  // 创建一个新的音频缓冲区
  const offlineContext = new OfflineAudioContext(1, length, sampleRate);
  const bufferSource = offlineContext.createBufferSource();
  bufferSource.buffer = audioBuffer;

  // 添加压缩效果
  const compressor = offlineContext.createDynamicsCompressor();
  compressor.threshold.value = -level * 10;
  compressor.knee.value = level * 5;
  compressor.ratio.value = level * 2;
  compressor.reduction.value = -level * 2;
  compressor.attack.value = 0;
  compressor.release.value = 0.2;

  bufferSource.connect(compressor);
  compressor.connect(offlineContext.destination);
  bufferSource.start();

  return offlineContext.startRendering().then((buffer) => {
    return buffer;
  });
}

function compressAndDistortAudio(audioBuffer, level) {
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  const channelData = audioBuffer.getChannelData(0);

  // 创建一个新的音频缓冲区
  const offlineContext = new OfflineAudioContext(1, length, sampleRate);
  const bufferSource = offlineContext.createBufferSource();
  bufferSource.buffer = audioBuffer;

  // 添加压缩效果
  const compressor = offlineContext.createDynamicsCompressor();
  compressor.threshold.value = -level * 10;
  compressor.knee.value = level * 5;
  compressor.ratio.value = level * 2;
  compressor.reduction.value = -level * 2;
  compressor.attack.value = 0;
  compressor.release.value = 0.2;

  // 添加失真效果
  const distortion = offlineContext.createWaveShaper();
  const curve = new Float32Array(44100);
  for (let i = 0; i < 44100; i++) {
    curve[i] = Math.sin(i * 0.01);
  }
  distortion.curve = curve;
  distortion.oversample = '4x';

  bufferSource.connect(compressor);
  compressor.connect(distortion);
  distortion.connect(offlineContext.destination);
  bufferSource.start();

  return offlineContext.startRendering().then((buffer) => {
    return buffer;
  });
}

function downloadAudio() {
  const downloadButton = document.getElementById('downloadButton');
  const url = URL.createObjectURL(processedAudioBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'processed_audio.wav';
  a.click();
  URL.revokeObjectURL(url);
}

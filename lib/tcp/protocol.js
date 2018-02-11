
const msgpack = require('msgpack5')();
const zlib = require('zlib');

const ACTOR_MSG = 0;

const ACTOR = 0;
const TEMP = 1;
const NOBODY = 2;

const encodeReference = (actorRef) => {
  switch (actorRef.type) {
    case 'actor':
      return [ACTOR, actorRef.system.name, actorRef.path.parts];
    case 'temp':
      return [TEMP, actorRef.system.name, actorRef.id];
    case 'nobody':
      return [NOBODY];
    default: return undefined;
  }
};

const decodeReference = (ref) => {
  const { TemporaryReference, ActorReference, Nobody } = require('../references');
  const { ActorPath } = require('../paths');
  if (Array.isArray(ref) && ref.length === 4 && ref[0] === ACTOR_MSG) {
    const [actorType, systemName, partsOrId] = ref.slice(1);
    switch (actorType) {
      case ACTOR: return new ActorReference(systemName, new ActorPath(partsOrId, { name: systemName }));
      case TEMP: return new TemporaryReference(systemName, partsOrId);
      case NOBODY: return new Nobody();
    }
  }
};

const encode = (recipient, msg, sender) => {
  let payload = [ACTOR_MSG, encodeReference(recipient), encodeReference(sender), msg];
  let gzipStream = zlib.createGzip();
  const encoder = msgpack.encoder();
  encoder.pipe(gzipStream);
  encoder.end(payload);
  return gzipStream;
};

const decode = (stream) => {
  let gunzipStream = zlib.createGunzip();
  const decoder = msgpack.decoder();
  stream.pipe(gunzipStream).pipe(decoder);
  return new Promise((resolve, reject) => {
    let data;
    decoder.on('data', (d) => { (data) = d; });
    decoder.on('end', () => {
      if (Array.isArray(data) && data.length === 3) {
        let recipient = decodeReference(data[0]);
        let sender = decodeReference(data[1]);
        let msg = data[2];
        resolve({ msg, sender, recipient });
      } else {
        reject(new Error('Msg was badly formed'));
      }
    });
  });
};

module.exports.encode = encode;
module.exports.decode = decode;

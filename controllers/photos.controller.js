const Photo = require('../models/photo.model');
const Voter = require('../models/voter.model');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title && author && email && file.size !== 0) { // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];

      const titlePattern = new RegExp(/^([A-z]|\s|[0-9]|\.){1,25}$/);
      if (!titlePattern.test(title)) throw new Error('Invalid title pattern...');

      const authorPattern = new RegExp(/^([A-z]|\s|[0-9]|\.){1,50}$/);
      if (!authorPattern.test(author)) throw new Error('Invalid author pattern...');

      const emailPattern = new RegExp(/^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.([a-z]{1,6}))$/i);
      if (!emailPattern.test(email)) throw new Error('Invalid email pattern...');
      
      if (['jpg', 'png'].includes(fileExt) && title.length <= 25 && author.length <= 50) {
        const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      }
      else {
        throw new Error('Wrong file type or title/author fields!');
      }
      
    }
    else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
      const activeVoter = await Voter.findOne({ user: req.clientIp });
      
      if (!activeVoter) {
        const newVoter = new Voter({ user: req.clientIp, votes: [ photoToUpdate._id ] });
        await newVoter.save();
      }
      else {
        
        if (activeVoter.votes.includes(photoToUpdate._id)) {
          throw new Error('Cannot voting twice');
        }
        else {
          activeVoter.votes.push(photoToUpdate._id);
          await activeVoter.save();
        }
      }

      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: 'OK' });
    }
  } catch(err) {
    res.status(500).json(err);
  }

};

// Modules
const firebase = require('firebase'); // Non-admin firebase SDK
const admin    = require('firebase-admin'); // Admin Firebase SDK
// Non-admin firebase services
require('firebase/database'); // Firebase Database SDK service

const debugMode = process.argv.slice(2)[0] === 'debug';

// Sets up firebase admin/non-admin
const init = () => {
    const pkgInfo = require('./package.json');
    console.info('CATmistry Android Database Updater: Version', pkgInfo.version, '\nWritten by:', pkgInfo.author, '\n');
    if (debugMode) console.warn('### DEBUG MODE ENABLED! DATABASE WON\'T BE UPDATED! ###\n');
    // Init Firebase Admin SDK
    console.debug('Initializing Firebase Admin SDK...');
    admin.initializeApp({
        credential: admin.credential.cert(require('./serviceAccount.json')),
        databaseURL: "https://catmistry-android-default-rtdb.firebaseio.com"
    });
    console.debug('Initialized Firebase Admin SDK');
    // Init non-admin (iOS) Firebase SDK
    console.debug('Initializing client-side Firebase SDK...');
    firebase.initializeApp( {
        apiKey: "AIzaSyAIFV5HkcDYZ8XWi9qn-5z8mBQS_pAAbo8",
        authDomain: "catmistry-swift.firebaseapp.com",
        databaseURL: "https://catmistry-swift-default-rtdb.firebaseio.com",
        projectId: "catmistry-swift",
        storageBucket: "catmistry-swift.appspot.com",
        messagingSenderId: "301092190216",
        appId: "1:301092190216:web:6ea3878803513e1b6079bd",
        measurementId: "G-RV0RFGMQ81"
    });
    console.debug('Initialized client-side Firebase SDK...');
    console.log('Completed initialization');
}

const exit = (exitCode = 0) => {
    console.log('Thanks for using the CATmistry Database updater.');
    process.exit(exitCode);
}

const iOStoAndroidImg = (iosFilename) => {
    return iosFilename.replace(/\.[^/.]+$/, "").replace(/-/gm, '_').toLowerCase();
}

const main = () => {
    const inDB  = firebase.database();
    const outDB = admin.database();
    inDB.ref('/').once('value').then((snapshot) => {
        console.log('Contents of input database:');
        // console.dir(snapshot.child('learnTopics').toJSON());

        let outBuff = {
            learnTopics: {},
            learnQns: {},
            learnSubTopics: {}
        };
        let index = 0
        snapshot.child('learnTopics').forEach((learnTopic) => {
            // console.log(learnTopic.child('subTopics').toJSON());

            let subTopics = []
            learnTopic.child('subTopics').forEach((subTopic) => {
                subTopics.push({
                    title: subTopic.child('title').val(),
                    icon: iOStoAndroidImg(subTopic.child('pic').val())
                });
            });
            outBuff.learnSubTopics[index.toString()] = subTopics;

            outBuff.learnTopics[index.toString()] = {
                title: learnTopic.child('title').val(),
                icon:  iOStoAndroidImg(learnTopic.child('pic').val()),
                unlockPoints: learnTopic.child('pointsNeeded').val()
            };
            outBuff.learnQns[index.toString()] = learnTopic.child('questions').val();
            index++;
        });

        console.log('\nData to be written to output database:\n', outBuff);
        // Write the data to the output database
        if (debugMode) {
            console.log('Debug mode enabled, not writing to database. Exiting...');
            exit();
        }
        console.debug('\nNow writing to output database...');
        outDB.ref().set(outBuff, (e) => {
            if (e) console.error('Failed to write to output DB. Error:\n\n', e.message, e.code);
            else console.log('Wrote data to output db successfully. Exiting...');

            // Once everything has finished, exit
            exit();
        });
    });
}

// Entry points
init();
console.debug('Starting main function\n');
main();
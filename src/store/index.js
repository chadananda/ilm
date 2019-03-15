import Vue from 'vue'
import Vuex from 'vuex'
import superlogin from 'superlogin-client'
import hoodie from 'pouchdb-hoodie-api'
import PouchDB from 'pouchdb'
import {BookBlock} from './bookBlock'
import {BookBlocks} from './bookBlocks'
import {liveDB} from './liveDB'
const _ = require('lodash')
import axios from 'axios'
PouchDB.plugin(hoodie)

// const ilm_content = new PouchDB('ilm_content')
// const ilm_content_meta = new PouchDB('ilm_content_meta')

Vue.use(Vuex)

const ILM_CONTENT = 'ilm_content';
const ILM_CONTENT_META = 'ilm_content_meta';
const ILM_CONTENT_FILES = 'ilm_library_files';
const ILM_TASKS = 'ilm_tasks';
const ILM_COLLECTIONS = 'ilm_collections';
const ILM_LIBRARIES = 'ilm_libraries';
const POUCH_CFG = {
    ajax: {
        timeout: 120000/*,
        heartbeat: 20000*/
    }
};

// const API_ALLBOOKS = '/static/books.json'

function defer() {
  var res, rej;
  var promise = new Promise((resolve, reject) => {
    res = resolve;
    rej = reject;
  });
  promise.resolve = res;
  promise.reject = rej;
  return promise;
}

export const store = new Vuex.Store({
  state: {
    auth: superlogin,
    isLoggedIn: false,
    isAdmin: false,
    isEditor: false,
    isLibrarian: false,
    isBookkeeper: false,
    isEngineer: false,
    isReader: false,
    isNarrator: false,
    isProofer: false,
    allowCollectionsEdit: false,
    allowPublishCurrentBook: false,
    allRolls: [],

    metaDB: false,
    metaDBcomplete: false,
    tasksDB: false,
    collectionsDB: false,
    librariesDB: false,

    metaRemoteDB: false,
    tasksRemoteDB: false,
    collectionsRemoteDB: false,
    librariesRemoteDB: false,

    books_meta: [],

    currentBookid: '',
    currentBook: {},
    currentBookMeta: {},
//     currentBook_dirty: false,
//     currentBookMeta_dirty: false,
    currentEditingBlockId: '',
    currentBookFiles: { coverimg: false },
    currentBookBlocksLeft: 0,
    currentBookBlocksLeftId: 'AAA',
    currentBookToc: {bookId: '', data: []},
    currentAudiobook: {},

    bookFilters: {filter: '', language: '', importStatus: 'staging'},
    editMode: 'Editor',
    allowBookEditMode: false,
    tc_currentBookTasks: {"tasks": [], "job": {}, "assignments": [], "can_resolve_tasks": [], "is_proofread_unassigned": false},
    tc_tasksByBlock: {},
    tc_userTasks: {list: [], total: 0},
    API_URL: process.env.ILM_API + '/api/v1/',
    bookCollectionsAll: [],
    bookCollections: [],
    collectionsFilter: {title: '', language: ''},
    currentCollection: {},
    currentCollectionFiles: { coverimg: false },
    currentCollectionId: false,
    allowPublishCurrentCollection: false,
    libraries: [],
    currentLibrary: {},
    currentLibraryId: false,

    user: {},
    currentBookCounters: {not_marked_blocks: '0', narration_blocks: '0', not_proofed_audio_blocks: '0', approved_audio_in_range: '0', approved_tts_in_range: '0', changed_in_range_audio: '0', change_in_range_tts: '0'},

    ttsVoices : [],

    blockers: [],

    lockedBlocks: [],
    aligningBlocks: [],
    storeList: new Map(), // global parlist
    storeListO: new BookBlocks(),
    blockSelection: {
      start: {},//block
      end: {},//block
    },
    alignCounter: {
      count: 0,
      countAudio: 0,
      countTTS: 0,
      blocks: []
    },
    alignWatch: null,
    audiobookWatch: null,
    selectionXHR: null,
    partOfBookBlocksXHR: null,
    tasksXHR: 0,
    approveBlocksList: [],
    replicatingDB: {},
    adminOrLibrarian: false,
    currentJobInfo: {
      can_resolve_tasks: [],
      mastering: null,
      proofing: null,
      published: null,
      text_cleanup: null,
      is_proofread_unassigned: null,
      executors: {editor: null, proofer: null, narrator: null}
    },
    taskTypes: {tasks: [], categories: []},
    liveDB: new liveDB(),
    bookCategories: [
      {
        group: 'Reader',
        categories: [
          'History', 'Ideas', 'Science', 'Stories', 'Verse'
        ]
      },
      {
        group: 'Ocean',
        categories: [
          'Bahá’í', 'Buddhist', 'Christian', 'Confucian', 'Hindu', 'Islam', 'Judaism', 'Sikh', 'Tao', 'Zoroastrian'
        ]
      }
    ],
    loadBookWait: null,
    loadBookTaskWait: null
  },

  getters: {
    auth: state => state.auth,
    isLoggedIn: state => state.isLoggedIn,
    isAdmin: state => state.isAdmin,
    isEditor: state => state.isEditor,
    isNarrator: state => state.isNarrator,
    isProofer: state => state.isProofer,
    isLibrarian: state => state.isLibrarian,
    isBookkeeper: state => state.isBookkeeper,
    isEngineer: state => state.isEngineer,
    isReader: state => state.isReader,
    allowPublishCurrentBook: state => state.allowPublishCurrentBook,
    allRolls: state => state.allRolls,
    allBooks: state => state.books_meta || [],
//     allBooks: state => {
//       console.log('state.tc_userTasks', state.tc_userTasks);
//       if (state.adminOrLibrarian) {
//         return state.books_meta;
//       } else {
//         let books = [];
//         //console.log(state.tc_userTasks);
//         for (let i in state.books_meta){
//           if (state.books_meta[i].editor == state.user._id && state.books_meta[i].published == true){
//             books.push(state.books_meta[i]);
//           }
//         }
//
//         if (state.tc_userTasks && state.tc_userTasks.list) {
//           for (let t_id in state.tc_userTasks.list) {
//             let job = state.tc_userTasks.list[t_id];
//             if ((job.tasks && job.tasks.length > 0) || job.is_proofread_unassigned) {
//               let exists = books.find(_b => _b._id == job.bookid);
//               if (!exists) {
//                 let b = state.books_meta.find(_b => job.bookid == _b._id);
//                 if (b) {
//                   //console.log('Adding book', b._id);
//                   books.push(b);
//                 }
//               }
//             }
//           };
//         }
//         return books;
//       }
//     },
    bookFilters: state => state.bookFilters,
    currentBookid: state => state.currentBookid,
    currentBook: state => state.currentBook,
    currentBookMeta: state => state.currentBookMeta,
    currentBookFiles: state => state.currentBookFiles,
    currentBookBlocksLeft: state => state.currentBookBlocksLeft,
    currentBookBlocksLeftId: state => state.currentBookBlocksLeftId,
    bookEditMode: state => state.editMode,
    allowBookEditMode: state => state.currentBookid && (state.isAdmin || state.isLibrarian || state.allowBookEditMode) && state.currentBookMeta.status != 'import_text',
    allowArchiving: state => state.isProofer,
    tc_currentBookTasks: state => state.tc_currentBookTasks,
    tc_tasksByBlock: state => state.tc_tasksByBlock,
    tc_userTasks: state => state.tc_userTasks,
    audiobookWatch: state => state.audiobookWatch,
    allowCollectionsEdit: state => state.isAdmin || state.isLibrarian,
    bookCollections: state => state.bookCollections,
    currentCollection: state => state.currentCollection,
    currentCollectionFiles: state => state.currentCollectionFiles,
    collectionsFilter: state => state.collectionsFilter,
    allowPublishCurrentCollection: state => state.allowPublishCurrentCollection,
    authors: state => {
      let result = [];
      if (state.currentBookMeta.authors) {
        state.currentBookMeta.authors.forEach((author)=>{
          result.push({ text: author.name, color: author.color })
        })
      }
      return result;
    },
    libraries: state => state.libraries,
    currentLibrary: state => state.currentLibrary,
    user: state => state.user,
    currentBookCounters: state => state.currentBookCounters,
    ttsVoices: state => {
      if (!state.currentBookMeta.language || state.currentBookMeta.language === '') return state.ttsVoices;
      let langPrefix = state.currentBookMeta.language.split('-')[0];
      let result = [];
      if (state.ttsVoices) {
        state.ttsVoices.forEach((batch)=>{
          if (batch.code.indexOf(langPrefix+'-') !== -1) result.push(batch);
        })
      }
      return result;
    },

    isBlocked: state => state.blockers.length > 0,
    blockers: state => state.blockers,
    isBlockLocked: state => (id) => {
      //if (typeof localStorage === 'undefined') {
        //return false;
      //}
      let locked = false;
      if (state.lockedBlocks.length > 0) {
        //let lock = localStorage.getItem('lock_' + id);
        //console.log(lock, id)
        let l = state.lockedBlocks.find(_l => _l._id === id);
        locked = l ? true : false;
      }
      if (!locked && state.aligningBlocks.length > 0) {
        let l = state.aligningBlocks.find(_l => _l._id === id);
        locked = l ? true : false;
      }
      return locked;
    },

    storeList: state => state.storeList, // global parlist
    storeListO: state => state.storeListO, // global parlistO
    blockSelection: state => state.blockSelection,
    alignCounter: state => state.alignCounter,
    lockedBlocks: state => state.lockedBlocks,
    hasLocks: state => (type) => {
      //console.log(state.lockedBlocks, Object.keys(state.lockedBlocks).length)
      if (type === 'align') {
        return state.aligningBlocks.length > 0;
      } else if (state.lockedBlocks.length > 0) {
        let l = state.lockedBlocks.filter(l => l.type === type)
        return l && l.length > 0;
      } else {
        return false;
      }
    },
    aligningBlocks: state => state.aligningBlocks,
    currentAudiobook: state => state.currentAudiobook,
    currentBookToc: state => state.currentBookToc,
    approveBlocksList: state => state.approveBlocksList,
    adminOrLibrarian: state => state.adminOrLibrarian,
    currentJobInfo: state => state.currentJobInfo,
    taskTypes: state => state.taskTypes,
    liveDB: state => state.liveDB,
    bookCategories: state => state.bookCategories
  },

  mutations: {

    set_localDB (state, payload) {
        state[payload.dbProp] = new PouchDB(payload.dbName, POUCH_CFG);
    },

    set_remoteDB (state, payload) {
        let dbPath = superlogin.getDbUrl(payload.dbName);
        if (process.env.DOCKER) {
            dbPath = dbPath.replace('couchdb', 'localhost')
        }
        state[payload.dbProp] = new PouchDB(dbPath, POUCH_CFG);
    },

    set_currentAudiobook (state, audiobook) {
      state.currentAudiobook = audiobook;
      //console.log('CURRENT AUDIOBOOK', state.currentAudiobook)
    },

    SET_CURRENTBOOK_FILTER (state, obj) { // replace any property of bookFilters
      for (var prop in obj) if (['filter', 'language', 'importStatus'].indexOf(prop) > -1) {
        state.bookFilters[prop] = obj[prop]
        // console.log("Setting bookfilter."+prop, obj[prop])
        // console.log(state.bookFilters)
      }
    },

    // initiateBooks (state, books) {
    //   state.books = books
    //   if (state.route.params.hasOwnProperty('bookid')) state.currentBookid = state.route.params.bookid
    // },

    SET_CURRENTBOOK (state, book) {
      state.currentBook = book
    },

    SET_CURRENTBOOK_META (state, meta) {
      // state.currentBookid = meta._id
      // state.currentBook = book
//       state.currentBook_dirty = false
//       state.currentBookMeta_dirty = false
      if (meta) {
        if (meta.publishedVersion === 'false') {
          meta.publishedVersion = false;
        }
        if (meta.voices && Object.keys(meta.voices).length === 0) {
          meta.voices = {
            'title': false,
            'header': false,
            'paragraph': false,
            'footnote': false
          };
        }
        state.currentBookMeta = meta;
        state.currentBookMeta._id = meta.bookid;
        state.currentBookid = meta.bookid
        if (!state.currentBookMeta.styles) {
          state.currentBookMeta.styles = {};
        }
        if (!state.currentBookMeta.isMastered) {
          state.currentBookMeta.isMastered = false;
        }
        if (!state.currentBookMeta.voices) {
          state.currentBookMeta.voices = {
            title: '',
            header: '',
            paragraph: '',
            footnote: ''
          };
        }
        if (state.currentBookMeta.language == 'en') {
          let default_voice = null;
          state.ttsVoices.forEach(group => {
            if (!default_voice && group.children) {
              default_voice = group.children.find(ch => ch.id == 'Brian');
            }
          });
          if (default_voice && Object.keys(state.currentBookMeta.voices).length > 0) {
            for (let type in state.currentBookMeta.voices) {
              if (!state.currentBookMeta.voices[type]) {
                state.currentBookMeta.voices[type] = default_voice.id
              }
            }
          }
        }
        if (!state.currentBookMeta.numbering) {
          state.currentBookMeta.numbering = 'x_x';
        }
        if (meta.hasOwnProperty('collection_id') && (!meta.collection_id || meta.collection_id === null || meta.collection_id.length == 0)) {
          state.currentBookMeta.collection_id = false;
        }
      } else {
        state.currentBookMeta = {}
        state.currentBookid = ''
      }
    },

//     CLEAN_CURRENTBOOK_FILES (state) {
//       state.currentBookFiles = {coverimg: false};
//     },

    SET_CURRENTBOOK_FILES (state, fileObj) {
      if (fileObj && fileObj.fileBlob) {
        let url = URL.createObjectURL(fileObj.fileBlob);
        state.currentBookFiles[fileObj.fileName] = url;
      } else state.currentBookFiles[fileObj.fileName] = false;
    },

    SET_CURRENT_COLLECTION (state, collection) {
      state.currentCollection = collection;
      state.currentCollectionId = collection._id ? collection._id : false;
    },

    SET_CURRENTCOLLECTION_FILES (state, fileObj) {
      if (fileObj && fileObj.fileBlob) {
        let url = URL.createObjectURL(fileObj.fileBlob);
        state.currentCollectionFiles[fileObj.fileName] = url;
      } else {
        state.currentCollectionFiles[fileObj.fileName] = false;
      }
    },

    SET_COLLECTIONS_FILTER (state, filter) {
      for(var field in filter) {
        state.collectionsFilter[field] = filter[field];
      }
      //console.log(state.collectionsFilter)
    },

    SET_CURRENT_LIBRARY (state, library) {
      state.currentLibrary = library;
      state.currentLibraryId = library._id ? library._id : false;
    },

    SET_CURRENTBOOKBLOCKS_LEFT (state, blocksCount) {
      state.currentBookBlocksLeft = blocksCount;
    },

    SET_CURRENTBOOKBLOCKS_LEFT_ID (state, blockId) {
      state.currentBookBlocksLeftId = blockId;
    },

    setEditMode (state, editMode) {
      state.editMode = editMode
    },

    SET_BOOKLIST (state, books) {
      state.books_meta = books
    },

    RESET_LOGIN_STATE (state) {
      state.isLoggedIn = superlogin.authenticated()
      state.isAdmin = superlogin.confirmRole('admin')
      state.isEditor = superlogin.confirmRole('editor')
      state.isNarrator = superlogin.confirmRole('narrator')
      state.isProofer = superlogin.confirmRole('proofer')
      state.isLibrarian = superlogin.confirmRole('librarian')
      state.isBookkeeper = superlogin.confirmRole('bookkeeper')
      state.isEngineer = superlogin.confirmRole('engineer')
      state.isReader = superlogin.confirmRole('reader')
      // state.allRolls =
    },

    updateBookMeta (state, meta) {
      state.currentBookMeta = meta
    },

    ALLOW_BOOK_EDIT_MODE (state, allow) {
      state.allowBookEditMode = allow;
    },

    TASK_LIST_LOADED (state) {
      let tc_userTasks = 0;
      state.tc_tasksByBlock = {};
      state.tc_currentBookTasks = {"tasks": [], "job": {}, "assignments": [], "can_resolve_tasks": [], "is_proofread_unassigned": false};
      for (let jobid in state.tc_userTasks.list) {
        let job = Object.assign({}, state.tc_userTasks.list[jobid])
        tc_userTasks+= job.tasks.length
        if (job.bookid == state.currentBookid) {
          /*if (t.comment) {
            t.comment = t.comment.replace('\n', '<br>');
          }
          if (t.blockid) {
            state.tc_tasksByBlock[t.blockid] = t
          }*/
          let assignments = []
          job.tasks.forEach(t => {
            switch (t.type) {
              case 'text-cleanup': // cleanup text
                assignments.push('metadata');
                assignments.push('metadata_cleanup');
                assignments.push('content');
                assignments.push('content_cleanup');
                if (job.type == 'with-audio') {
                  if (!state.currentBookMeta.hasMasteredAudio) {
                    assignments.push('upload_audio');
                  }
                }
                break;
              case 'narrate-block':
              case 'fix-block-narration':
                if (assignments.indexOf('block_narrate') === -1) {
                  assignments.push('block_narrate');
                }
                break;
              case 'master-audio':
                assignments.push('audio_mastering');
                break;
              case '': // approve book
                assignments.push('content');
                assignments.push('content_approve');
                break;

            }
            if (t.blockid) {
              if (typeof state.tc_tasksByBlock[t.blockid] === 'undefined') {
                state.tc_tasksByBlock[t.blockid] = [];
              }
              state.tc_tasksByBlock[t.blockid].push(t)
            }
          })
          state.tc_currentBookTasks = {job: job, tasks: job.tasks, assignments: assignments, can_resolve_tasks: job.can_resolve_tasks ? job.can_resolve_tasks : [], is_proofread_unassigned: job.is_proofread_unassigned ? job.is_proofread_unassigned : false}
        }
      }
      state.tc_userTasks.total = tc_userTasks;
      state.allowBookEditMode = state.tc_currentBookTasks.tasks.length > 0 || state.tc_currentBookTasks.is_proofread_unassigned;
    },
    PREPARE_BOOK_COLLECTIONS(state) {
      if (state.isAdmin || state.isLibrarian) {
        state.bookCollections = state.bookCollectionsAll;
      } else if (state.tc_userTasks) {
        if (state.tc_userTasks.total) {
          let collections = [];
          for (let jobid in state.tc_userTasks.list) {
            state.bookCollectionsAll.forEach(c => {
              if (c.books && c.books.indexOf(state.tc_userTasks.list[jobid].bookid) !== -1) {
                if (state.tc_userTasks.list[jobid].tasks && state.tc_userTasks.list[jobid].tasks.length > 0) {
                  let exists = collections.find(_c => _c._id === c._id);
                  if (!exists) {
                    collections.push(c);
                  }
                }
              }
            });
          }
          state.bookCollections = collections;
        }
      }
      state.bookCollections.forEach(c => {
        let pages = 0;
        c.books.forEach(b => {
          let book = state.books_meta.find(_b => _b._id === b);
          if (book) {
            pages+= book.wordcount ? Math.round(book.wordcount / 300) : 0;
          }
        });

        c.pages = pages;
      });
    },
    SET_ALLOW_BOOK_PUBLISH(state, allow) {
      state.allowPublishCurrentBook = allow;
    },
    SET_ALLOW_COLLECTION_PUBLISH(state, allow) {
      state.allowPublishCurrentCollection = allow;
    },
    SET_LIBRARIES(state, libraries) {
      if (state.isAdmin) {
        state.libraries = libraries;
      } else if (state.isLibrarian) {
        let libraries_list = [];
        libraries.forEach(l => {
          if (l.librarians) {
            let librarian = l.librarians.find(l => l.id == state.auth.getSession().user_id);
            if (librarian) {
              libraries_list.push(l)
            }
          }
        });
        state.libraries = libraries_list;
      } else {
        state.libraries = [];
      }
    },

    SET_CURRENTBOOK_COUNTER(state, counter) {
      state.currentBookCounters[counter.name] = counter.value;
    },

    SET_TTS_VOICES (state, ttsVoices) {
      state.ttsVoices = ttsVoices;
    },

    set_blocker (state, bName) {
      if (state.blockers.indexOf(bName) == -1) state.blockers.push(bName);
    },
    clear_blocker (state, bName) {
      let idx = state.blockers.indexOf(bName);
      //console.log('clear_blocker', bName, idx, state.blockers);
      if (idx > -1) state.blockers.splice(idx, 1);
    },
    add_block_lock(state, data) {
      if (data.block) {
        if (typeof localStorage !== 'undefined') {
          data.set_at = Date.now()
          let lock = localStorage.getItem('lock_' + data.block.blockid);
          if (lock) {
            try {
              lock = JSON.parse(lock);
              if (lock.watch && data.watch) {
                lock.watch.forEach(w => {
                  if (data.watch.indexOf(w) === -1) {
                    data.watch.push(w);
                  }
                });
              }
              if (lock.type && data.type && lock.type !== data.type) {
                return;
              }
            } catch(err) {
              lock = data;
            }
            lock = Object.assign(lock, data);
          } else {
            lock = data;
          }
          localStorage.setItem('lock_' + data.block.blockid, JSON.stringify(lock));
          let r = state.lockedBlocks.find(l => l._id === data.block.blockid);
          if (!r) {
            state.lockedBlocks.push({_id: data.block.blockid, type: lock.type});
          }
        }
      }
    },
    clear_block_lock(state, data) {
      if (data.block.blockid) {
        let remove_lock = () => {
          let r = state.lockedBlocks.find(l => l._id === data.block.blockid);
          if (r) {
            state.lockedBlocks.splice(state.lockedBlocks.indexOf(r), 1);
          }
        };
        if (typeof localStorage !== 'undefined') {
          /*let lock = state.blockLocks[data.block._id];
          if (lock) {
            if (lock.block._rev !== data.block._rev) {
              delete state.blockLocks[data.block._id];
            }
          }*/
          let lock = localStorage.getItem('lock_' + data.block.blockid);
          if (lock) {
            try {
              lock = JSON.parse(lock);
            } catch(err) {
              localStorage.removeItem('lock_' + data.block.blockid);
              //if (typeof state.lockedBlocks[data.block._id] !== 'undefined') {
                //delete state.lockedBlocks[data.block._id];
              //}
              //state.lockedBlocks = [];
              //let r = state.lockedBlocks.find(l => l._id === data.block._id);
              //if (r) {
                //state.lockedBlocks.splice(state.lockedBlocks.indexOf(r), 1);
              //}
              remove_lock();
              return;
            }
            if (data.force) {
              localStorage.removeItem('lock_' + data.block.blockid)
              //if (typeof state.lockedBlocks[data.block._id] !== 'undefined') {
                //delete state.lockedBlocks[data.block._id];
              //}
              //state.lockedBlocks = [];
              remove_lock();
            } else if (lock.watch && lock.watch.length) {
              let watch = [];
              lock.watch.forEach((w, i) => {
                if (_.isEqual(lock.block[w], data.block[w])) {
                  watch.push(lock.watch[i]);
                } else {
                  //console.log('WATCH CHANGED, OLD', lock.block[w], 'NEW', data.block[w])
                }
              });
              lock.watch = watch;
              if (lock.watch.length == 0) {
                localStorage.removeItem('lock_' + data.block.blockid);
                //if (typeof state.lockedBlocks[data.block._id] !== 'undefined') {
                  //delete state.lockedBlocks[data.block._id];
                //}
                //state.lockedBlocks = [];
                remove_lock();
              } else {
                localStorage.setItem('lock_' + data.block.blockid, JSON.stringify(lock));
                //state.lockedBlocks[data.block._id] = {type: lock.type};
                let r = state.lockedBlocks.find(l => l._id === data.block.blockid);
                if (!r) {
                  state.lockedBlocks.push({_id: data.block.blockid, type: lock.type});
                }
              }
            } else if (lock.block._rev !== data.block._rev) {
              localStorage.removeItem('lock_' + data.block.blockid);
              //if (typeof state.lockedBlocks[data.block._id] !== 'undefined') {
                //delete state.lockedBlocks[data.block._id];
              //}
              //state.lockedBlocks = [];
              remove_lock();
            }
            if (lock.set_at && Date.now() - lock.set_at > 30 * 60 * 1000) {
              localStorage.removeItem('lock_' + data.block.blockid);
              //if (typeof state.lockedBlocks[data.block._id] !== 'undefined') {
                //delete state.lockedBlocks[data.block._id];
              //}
              //state.lockedBlocks = [];
              remove_lock();
            }
          } else {
            remove_lock();
          }
        }
      }
    },
    check_block_lock (state, data) {
      if (data.block && data.block.blockid) {
        if (typeof localStorage !== 'undefined') {
          if (localStorage.hasOwnProperty('lock_' + data.block.blockid)) {
            try {
              let item = localStorage.getItem('lock_' + data.block.blockid);
              item = JSON.parse(item);
              //state.lockedBlocks[data.block._id] = {type: item.type};
              let r = state.lockedBlocks.find(l => l._id === data.block.blockid);
              if (!r) {
                state.lockedBlocks.push({_id: data.block.blockid, type: item.type});
              }
            } catch(err) {

            }
          }
        }
      }
    },
    set_aligning_blocks(state, blocks) {
      state.aligningBlocks = [];
      if (blocks.length) blocks.forEach(b => {
        state.aligningBlocks.push({_id: b.blockid ? b.blockid : b._id});
      });
    },
    set_storeList (state, blockObj) {
      //console.log('set_storeList', Date.now());
      if (state.storeList) {
        let firstObj = state.storeList.values().next().value;
        if (!(firstObj && firstObj.bookid == blockObj.bookid)) {
          state.storeList = new Map();
        }
      } else {
        state.storeList = new Map();
      }

      state.storeList.set(blockObj.blockid, blockObj);
    },

    clear_storeList (state) {
      state.storeList = new Map();
    },

    clear_storeListO (state) {
      state.storeListO = new BookBlocks();
    },

    set_block_selection(state, selection) {
      state.blockSelection.start = typeof selection.start !== 'undefined' ? selection.start : {};
      state.blockSelection.end = typeof selection.end !== 'undefined' ? selection.end : {};
      if (state.blockSelection.start._id) {
        let _id_short = state.blockSelection.start._id.split('_').pop();
        if (_id_short.length > 7) {
          _id_short = _id_short.substr(0, 2) + '...' + _id_short.substr(_id_short.length - 3, 2);
        }
        state.blockSelection.start._id_short = _id_short;
      }
      if (state.blockSelection.end._id) {
        let _id_short = state.blockSelection.end._id.split('_').pop();
        if (_id_short.length > 7) {
          _id_short = _id_short.substr(0, 2) + '...' + _id_short.substr(_id_short.length - 3, 2);
        }
        state.blockSelection.end._id_short = _id_short;
      }
    },

    set_align_counter(state, counter) {
      state.alignCounter.count = typeof counter.count !== 'undefined' ? counter.count : 0;
      state.alignCounter.countTTS = typeof counter.countTTS !== 'undefined' ? counter.countTTS : 0;
      state.alignCounter.countAudio = typeof counter.countAudio !== 'undefined' ? counter.countAudio : 0;
      state.alignCounter.blocks = typeof counter.blocks !== 'undefined' ? counter.blocks : [];
      //let countAudio = state.alignCounter.count - state.alignCounter.countTTS;
      //state.alignCounter.countAudio = countAudio >= 0 ? countAudio : 0;
    }
  },

  actions: {

    emptyDB (context) {
      //PouchDB('ilm_content_meta').destroy()
    },

    // login event
    connectDB ({ state, commit, dispatch }, session) {
        state.liveDB.setSubscriberId(state.auth.getSession().token);
        state.adminOrLibrarian = superlogin.confirmRole('admin') || superlogin.confirmRole('librarian');
        commit('RESET_LOGIN_STATE');

        //commit('set_localDB', { dbProp: 'metaDB', dbName: 'metaDB' });
        //commit('set_localDB', { dbProp: 'contentDB', dbName: 'contentDB' });
        //commit('set_localDB', { dbProp: 'tasksDB', dbName: 'tasksDB' });
        commit('set_localDB', { dbProp: 'collectionsDB', dbName: 'collectionsDB' });
        commit('set_localDB', { dbProp: 'librariesDB', dbName: 'librariesDB' });

        //commit('set_remoteDB', { dbProp: 'metaRemoteDB', dbName: ILM_CONTENT_META });
        //commit('set_remoteDB', { dbProp: 'contentRemoteDB', dbName: ILM_CONTENT });
        commit('set_remoteDB', { dbProp: 'filesRemoteDB', dbName: ILM_CONTENT_FILES });
        //commit('set_remoteDB', { dbProp: 'tasksRemoteDB', dbName: ILM_TASKS });
        commit('set_remoteDB', { dbProp: 'collectionsRemoteDB', dbName: ILM_COLLECTIONS });
        commit('set_remoteDB', { dbProp: 'librariesRemoteDB', dbName: ILM_LIBRARIES });


//         state.metaDB.replicate.from(state.metaRemoteDB)
//         .on('complete', (info)=>{
//             state.metaDBcomplete = true;
//             dispatch('updateBooksList');
//             state.metaDB.sync(state.metaRemoteDB, {live: true, retry: true})
//             .on('change', (change)=>{
//                 console.log('metaDB change', change);
//                 dispatch('updateBooksList');
//                 // try to avoid meta glitches while update
//                 if (state.blockers.indexOf('updateBookMeta') > -1) {
//                   commit('clear_blocker', 'updateBookMeta');
//                 }// else {
//                   dispatch('reloadBookMeta');
//                 //}
//             })
//             .on('error', (err)=>{
//               // handle errors
//             })
//         });

//         state.contentDB.replicate.from(state.contentRemoteDB)
//         .on('complete', (info)=>{
//             state.contentDBcomplete = true;
//             state.contentDB.sync(state.contentRemoteDB, {live: true, retry: true})
//             .on('change', (change)=>{
//                 //console.log('contentDB change', change);
//             })
//             .on('error', (err)=>{
//               // handle errors
//             })
//         });
        /*state.replicatingDB.ilm_tasks = false;
        state.tasksDB.replicate.from(state.tasksRemoteDB)
        .on('complete', (info) => {
          state.replicatingDB.ilm_tasks = true;
          console.log('REPLICATION COMPLETE TASKS')
          state.tasksDB.sync(state.tasksRemoteDB, {live: true, retry: true})
          .on('change', (change) => {
            //console.log('Tasks DB change', change.change.docs);
            if (change.change && change.change.docs && Array.isArray(change.change.docs)) {
              let isReload = change.change.docs.filter(d => {
                //console.log('COMPARE', d, d.executor, state.auth.getSession().user_id);
                return d.executor === state.auth.getSession().user_id
              });
              if (isReload) {
                //console.log('LOAD')
                isReload.forEach(task => {
                  if (!task.time_completed) {
                    //console.log('PUSH', task)
                    state.tc_currentBookTasks.tasks.push(task);
                  } else {
                    let _t = state.tc_currentBookTasks.tasks.find(t => t._id == task._id);
                    //console.log('COMPLETED', _t);
                    if (_t) {
                      //console.log(state.tc_currentBookTasks.tasks.length);
                      state.tc_currentBookTasks.tasks.splice(state.tc_currentBookTasks.tasks.indexOf(_t), 1);
                      //console.log(state.tc_currentBookTasks.tasks.length);
                    }
                  }
                });
                dispatch('tc_loadBookTask');
              }
            }
          })
        });*/

        state.collectionsDB.replicate.from(state.collectionsRemoteDB)
        .on('complete', (info) => {
          dispatch('updateCollectionsList');
          state.collectionsDB.sync(state.collectionsRemoteDB, {live: true, retry: true})
          .on('change', (change) => {
            dispatch('updateCollectionsList');
          })
        });

        state.librariesDB.replicate.from(state.librariesRemoteDB)
          .on('complete', () => {
            dispatch('updateLibrariesList');
            state.librariesDB.sync(state.librariesRemoteDB, {live: true, retry: true})
              .on('change', () => {
                dispatch('updateLibrariesList');
            });
          });
        axios.get(state.API_URL + 'me')
          .then(response => {
            if (response) {
              if (response.status == 200) {
                state.user = response.data;
              }
            }
          })
          .catch(err => console.log(err));

//          state.librariesDB.replicate.from(state.librariesRemoteDB, {
//          /*filter: '_view',
//          view: 'filters_byLibrarian/byLibrarian',
//          query_params: {
//            key: "librarian2"
//          }*/
//          filter: 'filters_byLibrarian/byLibrarian',
//          query_params: {
//            user_id: "librarian2"
//          }
//        })
//          .on('complete', () => {
//            dispatch('updateLibrariesList');
//
//            setInterval(function() {
//              state.librariesDB.replicate.from(state.librariesRemoteDB, {
//              filter: 'filters_byLibrarian/byLibrarian',
//              query_params: {
//                user_id: "librarian2"
//              }})
//              .on('complete', () => {
//                console.log('COMPLETE');
//                dispatch('updateLibrariesList');
//              })
//              .on('change', (changes) => {
//                console.log(changes);
//                dispatch('updateLibrariesList');
//              });
//            }, 10000);
//            /*state.librariesDB.sync(state.librariesRemoteDB, {
//              live: true,
//              retry: true,
//              filter: 'filters_byLibrarian/byLibrarian',
//          query_params: {
//            user_id: "librarian2"
//          }
//            })
//            .on('change', (change) => {
//              console.log(change);
//              dispatch('updateLibrariesList');
//            });*/
//          });

          dispatch('getTaskTypes')
            .then(() => {
              dispatch('tc_loadBookTask');
            });
    },

    destroyDB ({ state, commit, dispatch }) {
      return new Promise((resolve, reject) => {

        //if (!state.isLoggedIn) return resolve();

        commit('set_localDB', { dbProp: 'metaDB', dbName: 'metaDB' });
        //commit('set_localDB', { dbProp: 'contentDB', dbName: 'contentDB' });
        //commit('set_localDB', { dbProp: 'tasksDB', dbName: 'tasksDB' });
        commit('set_localDB', { dbProp: 'collectionsDB', dbName: 'collectionsDB' });
        commit('set_localDB', { dbProp: 'librariesDB', dbName: 'librariesDB' });
        state.tc_currentBookTasks = {"tasks": [], "job": {}, "assignments": [], "can_resolve_tasks": [], "is_proofread_unassigned": false};

        if (state.metaDB) state.metaDB.destroy()
        //if (state.contentDB) state.contentDB.destroy()
        //if (state.tasksDB) state.tasksDB.destroy()
        if (state.collectionsDB) state.collectionsDB.destroy()
        if (state.librariesDB) state.librariesDB.destroy()

        console.log('destroyDB');
        window.setTimeout(() => {
          console.log('destroyDB Done');
          return resolve();
        }, 50)
      });
    },

    // logout event
    disconnectDB ({ state, commit }) {
      state.liveDB.stopWatchAll();
      axios.defaults.headers.common['Authorization'] = false;
      //window.setTimeout(() => {
          //if (state.metaDB) state.metaDB.destroy()
          //if (state.contentDB) state.contentDB.destroy()
          //if (state.tasksDB) state.tasksDB.destroy()
          if (state.collectionsDB) state.collectionsDB.destroy()
          if (state.librariesDB) state.librariesDB.destroy()
          commit('RESET_LOGIN_STATE');
      //}, 500)
    },

    updateBooksList ({state, commit, dispatch}) {
      return axios.get(state.API_URL + 'books')///user/' + state.auth.getSession().user_id
        .then((answer) => {
          commit('SET_BOOKLIST', answer.data.books)
          //dispatch('tc_loadBookTask')
        })
    },

    updateCollectionsList({state, commit, dispatch}) {
      let connection = state.collectionsDB.hoodieApi()
      connection.findAll()
        .then(collections => {
          state.bookCollectionsAll = collections
          commit('PREPARE_BOOK_COLLECTIONS');
          dispatch('reloadCollection');
        })
    },

    deleteCurrentBook (context) {
      // get _id for both book and meta
      // set _deleted=true on both
      // clear currentBookid
    },

    loadBookBlocks({commit, state, dispatch}, params) {
      let skip = params.skip ? `/${params.skip}` : '';
      let url = state.API_URL + `books/blocks/${params.bookId}`;
      return axios.get(url)
      .then((response) => {
        dispatch('startBookWatch', params.bookId)
        return response.data;
      })
      .catch(err => err)
    },

    startBookWatch({state}, bookid) {
      if (!bookid) {
        bookid = state.currentBookid
      }
      if (bookid) {
        state.liveDB.startWatch(bookid, 'blockV', {bookid: bookid}, (data) => {
          if (data) {

            //state.storeListO.delBlock(data.block);
            if (data.action === 'insert' && data.block) {
              if (!state.storeListO.get(data.block.id)) {
                state.storeListO.addBlock(data.block);//add if added, remove if removed, do not touch if updated
              }
            } else if (data.action === 'change' && data.block) {
              state.storeListO.updBlockByRid(data.block.id, data.block)
            } else if (data.action === 'delete') {

            }

            if (data.block && state.storeList.has(data.block.blockid)) {
              let block = state.storeList.get(data.block.blockid);
              if (block.isChanged) {
                if (block.status && data.block.status && block.status.assignee === data.block.status.assignee) {
                    if (block.voicework != data.block.voicework) {
                      block.voicework = data.block.voicework;
                      block.audiosrc = data.block.audiosrc;
                      block.audiosrc_ver = data.block.audiosrc_ver;
                      store.commit('set_storeList', new BookBlock(block));
                    }
                  } else {
                    store.commit('set_storeList', new BookBlock(data.block));
                  }
              } else {
                store.commit('set_storeList', new BookBlock(data.block));
              }
            } else if (data.block) {
              store.commit('set_storeList', new BookBlock(data.block));
            }
            state.storeListO.refresh();
          }
        });
      }
    },

    loadPartOfBookBlocks({commit, state, dispatch}, params) {
      if (state.partOfBookBlocksXHR != null) {
        return state.partOfBookBlocksXHR;
      }
      if (typeof params.onPage === 'undefined') {
        params.onPage = 10;
      }
      let req = state.API_URL + `books/blocks/${params.bookId}/onpage/${params.onPage}`;
      if (params.block) {
        if (params.block === 'unresolved' && params.taskType) {
          req += `/search/${params.taskType}`
        } else {
          req += `/from/${params.block}`
        }
      }
      state.partOfBookBlocksXHR = axios.get(req)
      .then((response) => {
        state.partOfBookBlocksXHR = null;
        return response.data;
      })
      .catch(err => {
        state.partOfBookBlocksXHR = null;
        return err;
      });
      return state.partOfBookBlocksXHR;
    },

    loadBook ({commit, state, dispatch}, book_id) {
      if (state.loadBookWait) {
        return state.loadBookWait
      }
      //console.log('loading currentBook: ', book_id)
      // if (!book_id) return  // if no currentbookid, exit
      // if (book_id === context.state.currentBookid) return // skip if already loaded

      // if currentbook exists, check if currrent book needs saving
      if (book_id != state.currentBookid) {
        commit('set_currentAudiobook', {});
      }
      //let oldBook = (state.currentBook && state.currentBook._id)

//       if (oldBook && state.currentBook_dirty || state.currentBookMeta_dirty) {
//         // save old state
//       }

      if (book_id && book_id === state.currentBookid) return Promise.resolve(state.currentBookMeta);

      if (book_id) {
        //console.log('state.metaDBcomplete', state.metaDBcomplete);
        //let metaDB = state.metaRemoteDB;
        state.liveDB.stopWatch('blockV');
        let bookMeta = new Promise((resolve, reject) => {
          axios.get(state.API_URL + 'books/book_meta/' + book_id)
            .then((answer) => {
              resolve(answer.data.meta);
            });
        });
        state.loadBookWait = bookMeta
        return bookMeta
        .then((answer) => {
          state.loadBookWait = null;
          commit('SET_CURRENTBOOK_META', answer)
          commit('TASK_LIST_LOADED')
          dispatch('getTotalBookTasks');
          dispatch('setCurrentBookCounters');
          dispatch('startAlignWatch');
          dispatch('startAudiobookWatch');
          dispatch('getCurrentJobInfo');
          //dispatch('loadBookToc', {bookId: book_id});
          state.filesRemoteDB.getAttachment(book_id, 'coverimg')
          .then(fileBlob => {
            commit('SET_CURRENTBOOK_FILES', {fileName: 'coverimg', fileBlob: fileBlob});
          })
          .catch((err)=>{
            commit('SET_CURRENTBOOK_FILES', {fileName: 'coverimg', fileBlob: false});
          })
          state.liveDB.stopWatch('metaV');
          state.liveDB.startWatch(book_id + '-metaV', 'metaV', {bookid: book_id}, (data) => {
            if (data && data.meta && data.meta.bookid === state.currentBookMeta.bookid) {
              commit('SET_CURRENTBOOK_META', data.meta)
              dispatch('getTotalBookTasks');
            }
          });
          return Promise.resolve(answer);
        }).catch((err)=>{
          state.loadBookWait = null;
          console.log('metaDB.get Error: ', err);
          return err;
        })
      } else {
        commit('SET_CURRENTBOOK_META', false);
        return Promise.resolve()
      }
    },

    reloadBookMeta ({commit, state, dispatch}) {
        if (state.currentBookMeta._id) {
            dispatch('getBookMeta', state.currentBookMeta._id).then((meta) => {
                commit('SET_CURRENTBOOK_META', meta)
                dispatch('getTotalBookTasks');
                state.filesRemoteDB.getAttachment(state.currentBookMeta._id, 'coverimg')
                .then(fileBlob => {
                  commit('SET_CURRENTBOOK_FILES', {fileName: 'coverimg', fileBlob: fileBlob});
                }).catch((err)=>{
                  commit('SET_CURRENTBOOK_FILES', {fileName: 'coverimg', fileBlob: false});
                })
            })
        }
    },

    reloadBookCover({commit, state}) {
      if (state.currentBookMeta._id) {
          state.filesRemoteDB.getAttachment(state.currentBookMeta._id, 'coverimg')
            .then(fileBlob => {
              commit('SET_CURRENTBOOK_FILES', {fileName: 'coverimg', fileBlob: fileBlob});
            }).catch((err)=>{
              commit('SET_CURRENTBOOK_FILES', {fileName: 'coverimg', fileBlob: false});
            })
        }
    },

    loadBookToc({state, commit, dispatch}, params) {
      if (state.currentBookToc.bookId === params.bookId && !params.isWait) return state.currentBookToc;
      if (state.blockers.indexOf('loadBookToc') !== -1) {
        return state.currentBookToc;
      }
      dispatch('freeze', 'loadBookToc');
      return axios.get(state.API_URL + `books/toc/${params.bookId}` + (params.isWait ? '/wait':''))
      .then((response) => {
        state.currentBookToc.bookId = params.bookId;
        state.currentBookToc.data = response.data;
        dispatch('unfreeze', 'loadBookToc');
        return response;
      })
      .catch(err => {
        dispatch('unfreeze', 'loadBookToc')
        return err;
      })
    },

    updateBlockToc({state, dispatch}, params) {
      dispatch('freeze', 'loadBookToc');
      return axios.put(state.API_URL + `books/toc/${params.bookid}/block/${params.blockid}`)
      .then((response) => {
        //state.currentBookToc.bookId = params.bookId;
        state.currentBookToc.data = response.data;
        dispatch('unfreeze', 'loadBookToc');
        return response;
      })
      .catch(err => {
        dispatch('unfreeze', 'loadBookToc')
        return err;
      })
    },

    updateBookVersion({state, dispatch}, update) {
      if (state.currentBookMeta._id) {
        let currMeta = state.currentBookMeta;
        if (typeof currMeta.version !== 'undefined' && currMeta.version === currMeta.publishedVersion && currMeta.published === true) {
          let versions = currMeta.version.split('.');
          if (versions && versions.length == 2) {
            if (update.minor) {
              versions[1] = (parseInt(versions[1]) + 1);
            }
            if (update.major) {
              versions[0] = (parseInt(versions[0]) + 1);
              versions[1] = 0;
            }
            let upd = {
              'version': versions[0] + '.' + versions[1],
              'pubType': 'Unpublished',
              'published': false,
              //'status': 'staging',
              //'demo': false,
              'isInTheQueueOfPublication': false,
              'isIntheProcessOfPublication': false
            };
            dispatch('updateBookMeta', upd)
              .then((meta) => {
                if (meta.collection_id) {
                  dispatch('updateCollectionVersion', Object.assign({id: meta.collection_id}, update));
                }
                dispatch('getTotalBookTasks');
              });
          }
        } else {
          // olku: Because it`s happening every time when we try to update meta fields
          // dispatch('reloadBookMeta');
        }
      }
    },

    updateBookMeta({state, dispatch, commit}, update) {
      update.bookid = state.currentBookMeta._id;
      return axios.put(state.API_URL + 'meta/' + state.currentBookMeta._id, update)
        .then(response => {
          console.log('updateBookMeta response', response);
          //state.currentBookMeta = response.data;
          //commit('SET_CURRENTBOOK_META', response.data)
          if (response.data["@class"] && response.status == 200) {
            let newMeta = Object.assign(state.currentBookMeta, response.data);
            commit('SET_CURRENTBOOK_META', newMeta);
            return Promise.resolve(response.data);
          } else {
            return Promise.reject(new Error('No data updated'));
          }
        })
        .catch(err => {
          return Promise.reject(err);
        })
    },

    loadCollection({commit, state, dispatch}, id) {
      if (id) {
        state.currentCollectionId = id;
        state.collectionsDB.get(id).then(collection => {
          commit('SET_CURRENT_COLLECTION', collection);
          dispatch('allowCollectionPublish');
          state.filesRemoteDB.getAttachment(state.currentCollectionId, 'coverimg')
          .then(fileBlob => {
            commit('SET_CURRENTCOLLECTION_FILES', {fileName: 'coverimg', fileBlob: fileBlob});
          }).catch((err)=>{
            commit('SET_CURRENTCOLLECTION_FILES', {fileName: 'coverimg', fileBlob: false});
          })
        }).catch((err)=>{

        })
      } else {
        commit('SET_CURRENT_COLLECTION', {});
        commit('SET_ALLOW_COLLECTION_PUBLISH', false);
      }
    },

    reloadCollection({state, commit, dispatch}) {
      if (state.currentCollectionId) {
        state.collectionsDB.get(state.currentCollectionId).then(collection => {
          commit('SET_CURRENT_COLLECTION', collection);
          dispatch('allowCollectionPublish');
          state.filesRemoteDB.getAttachment(state.currentCollectionId, 'coverimg')
          .then(fileBlob => {
            commit('SET_CURRENTCOLLECTION_FILES', {fileName: 'coverimg', fileBlob: fileBlob});
          }).catch((err)=>{
            commit('SET_CURRENTCOLLECTION_FILES', {fileName: 'coverimg', fileBlob: false});
          })
        }).catch((err)=>{
          console.log(err);
        })
      }
    },

    updateCollectionVersion({state, dispatch}, update) {
      let id = update.id || state.currentCollection._id;
      if (id) {
        state.collectionsRemoteDB.get(state.currentCollection._id)
          .then(collection => {
            if (typeof collection.version !== 'undefined' && collection.version === collection.publishedVersion && collection.published === true) {
              let versions = collection.version.split('.');
              if (versions && versions.length == 2) {
                if (update.minor) {
                  versions[1] = (parseInt(versions[1]) + 1);
                }
                if (update.major) {
                  versions[0] = (parseInt(versions[0]) + 1);
                  versions[1] = 0;
                }
                    collection['version'] = versions[0] + '.' + versions[1];
                    collection['published'] = false;
                    collection['state'] = 'unpublished';
                    state.collectionsRemoteDB.put(collection)
                      .then(() => {
                        dispatch('reloadCollection');
                      });
              }
            } else {
              dispatch('reloadCollection');
            }

          });
      }
    },

    allowCollectionPublish({state, commit}) {
      let allow_by_role = superlogin.confirmRole('librarian') || superlogin.confirmRole('admin');
      if (allow_by_role && state.currentCollection && state.currentCollection.books && state.currentCollection.books.length > 0 && state.books_meta) {
        let allow = typeof state.currentCollection.version === 'undefined' || state.currentCollection.version !== state.currentCollection.publishedVersion;
        if (allow) {
          state.currentCollection.books.forEach(b => {
            if (allow) {
              let _b = state.books_meta.find(__b => __b._id === b);
              if (_b) {
                allow = _b.published === true;
              }
            }
          });
        }
        commit('SET_ALLOW_COLLECTION_PUBLISH', allow);
      } else {
        commit('SET_ALLOW_COLLECTION_PUBLISH', false);
      }
    },

    updateLibrariesList ({state, commit, dispatch}) {
      state.librariesDB.hoodieApi().findAll()
        .then(libraries => {
          commit('SET_LIBRARIES', libraries);
          dispatch('reloadLibrary');
        })
    },

    loadLibrary({commit, state, dispatch}, id) {
      if (id) {
        state.currentLibraryId = id;
        state.librariesDB.get(id).then(library => {
          commit('SET_CURRENT_LIBRARY', library);
        }).catch((err)=>{

        })
      } else {
        commit('SET_CURRENT_LIBRARY', {});
      }
    },

    reloadLibrary({state, commit, dispatch}) {
      if (state.currentLibraryId) {
        state.librariesDB.get(state.currentLibraryId).then(library => {
          commit('SET_CURRENT_LIBRARY', library);
        }).catch((err)=>{
          console.log(err);
        })
      }
    },

    getBookMeta ({state}, bookid) {
        return axios.get(state.API_URL + 'books/book_meta/' + bookid)
          .then(response => {
            return Promise.resolve(response.data);
          })
          .catch(err => {
            console.log(err);
            return Promise.reject(err);
          });
    },

    getBlock ({commit, state, dispatch}, block_id) {
        return axios.get(state.API_URL + 'book/block/' + block_id)
          .then(response => {
            return Promise.resolve(response.data);
          })
          .catch(err => {
            console.log(err);
            return Promise.reject(err);
          });
    },

    getBlocks ({commit, state, dispatch}, blocksIds) {
      if (!blocksIds) {
        return Promise.resolve([]);
      }
      return axios.get(state.API_URL + 'books/blocks_data/' + state.currentBookid + '?ids=' + blocksIds.join(','))
        .then(res => {
          let result = [];
          res.data.forEach(b => {
            result.push(b);
          });
          return result;
        })
        .catch(err => console.log(err));
    },

    loopBlocksChain ({commit, state, dispatch}, params) {
      let requests = [];
      let results = {rows: [], finish: false, blockId: false};

      requests.push(defer());

      (function loop(i, block_id) {

        if ((typeof params.onpage === 'undefined' || i < params.onpage) && block_id) {
          dispatch('getBlock', block_id)
          .then((b)=>{
            if (b && b._id) {
              results.rows.push(b);
              loop(i+1, b.chainid);
            } else requests[0].resolve();
          })
          .catch((err)=>{
            //console.log('loop_BlocksChain Catch: ', err);
            results.finish = true;
            requests[0].resolve();
          })
        }
        else requests[0].resolve();
      })(0, params.startId); // start

      return Promise.all(requests)
      .then(() => {
        //console.log('loopBlocksChain results', results);
        return Promise.resolve(results);
      });
    },

    loopPreparedBlocksChain ({commit, state, dispatch}, params) {
      let results = {rows: []};
      return dispatch('getBlocks', params.ids)
      .then((rows)=>{
        results.rows = rows;
        return results;
      })
    },

    searchBlocksChain ({commit, state, dispatch}, params) {
      let requests = [];
      let results = {rows: [], finish: false, blockId: false};
      let task_type = params.search.task_type || false;

      requests.push(defer());

      let metadata_cleanup = state.currentJobInfo.text_cleanup;
      let audio_mastering = state.currentJobInfo.mastering;
      //console.log('searchBlocksChain 1', task_type, params);
      //console.log('searchBlocksChain 2', metadata_cleanup, audio_mastering);

      return axios.post(state.API_URL + 'books/' + params.book_id + '/unresolved',
      {
        'bookId': params.book_id || false,
        'startId': params.startId || false,
        'taskType': params.search.task_type || false,
        'metadataCleanup': metadata_cleanup,
        'audioMastering': audio_mastering,
        'onpage': 10
      })
      .then((result) => {
        return Promise.resolve(result.data);
      })
      .catch(err => {
        return Promise.reject(err);
      })
    },

    loadBlocksChain ({commit, state, dispatch}, params) {
      //console.log('load_BlocksChain', params);
      if (params.startId) {
        if (params.hasOwnProperty('search')) {
          return dispatch('searchBlocksChain', params);
        } else {
          return dispatch('loopBlocksChain', params);
        }
      }

    },

    _putBlock ({state}, block) {
      //console.log('_putBlock block', block);
      return state.contentRemoteDB
        .put(block)
        .then(res => Promise.resolve(res))
        .catch((err) => {
          console.log('_putBlock err', err);
          if (err.status == 404) {
          return state.contentDB
            .put(block)
            .then(res => Promise.resolve(res))
            .catch(err => Promise.reject(err));
          } else return Promise.reject(err);
        });
    },

    putBlock ({commit, state, dispatch}, block) {
        let cleanBlock = Object.assign({}, block);
        if (typeof block.clean === 'function') {
          cleanBlock = block.clean();
        }
        delete cleanBlock.parnum;
        delete cleanBlock.secnum;
        delete cleanBlock.isNumber;
        commit('set_blocker', 'putBlock');
        //console.log('putBlock', cleanBlock);
        /*return dispatch('getBlock', cleanBlock._id)
        .then(function(doc) {
          cleanBlock._rev = doc._rev;
          return dispatch('_putBlock', cleanBlock)
          .then((response) => {
            // handle response
            commit('clear_blocker', 'putBlock');
            return Promise.resolve(response);
          });
        })
        .catch((err) => {
            console.log('putBlock getBlock err', err);
            if (err.status == 404) {
              return dispatch('_putBlock', cleanBlock)
              .then((response) => {
                // handle response
                commit('clear_blocker', 'putBlock');
                return Promise.resolve(response);
              });
            } else {
              commit('clear_blocker', 'putBlock');
              console.log('Block save error:', err);
            }
        });*/
        return axios.put(state.API_URL + 'book/block/' + block._id,
          {
            'block': cleanBlock,
          })
            .then(response => {
              commit('clear_blocker', 'putBlock');
              block._rev = response.data.rev;
              dispatch('tc_loadBookTask', block.bookid);
              dispatch('getCurrentJobInfo')
                .then(() => {
                  if (state.currentJobInfo && state.currentJobInfo.published) {
                    dispatch('updateBookVersion', {major: true});
                  }
                });
              dispatch('getTotalBookTasks');
              return Promise.resolve(response.data);
            })
            .catch(err => {
              console.log(err);
            });
    },

    putBlockPart ({commit, state, dispatch}, blockData) {
      let cleanBlock = blockData.block.cleanField(blockData.field);
      blockData.block.partUpdate = true;
      //console.log('putBlockPart', cleanBlock);
      if (cleanBlock) {
        commit('set_blocker', 'putBlockPart');
        return dispatch('getBlock', cleanBlock._id)
        .then(function(doc) {
          return dispatch('_putBlock', _.merge(doc, cleanBlock))
          .then((response) => {
            commit('clear_blocker', 'putBlockPart');
            return Promise.resolve(response)
          })
        })
        .catch((err) => {
          console.log('Block save error:', err);
          commit('clear_blocker', 'putBlock');
          return Promise.reject(err);
        });
      } else {
        return Promise.resolve();
      }
    },

    putBlockO({commit, state}, params) {
      let rid = encodeURIComponent(params.rid);
      let req = state.API_URL + `books/blocks/block/${rid}`;
      return axios.put(req, params)
      .then((response) => {
        if (response.data.updated && response.data.updated > 0) {
          let block = state.storeListO.getBlockByRid(params.rid);
          if (block) {
            //block.isManual = true;
            state.storeListO.updBlockByRid(params.rid, params);
            return block.blockid;
          }
        }
        //console.log('response.data', response.data);
        if (Array.isArray(response.data)) response.data.forEach((blockO)=>{
          state.storeListO.updBlockByRid(blockO.rid, blockO);
        })
        return response.data;
      })
    },

    putNumBlockO({commit, state}, params) {
      let rid = encodeURIComponent(params.rid);
      let bookId = encodeURIComponent(params.bookId);
      let req = state.API_URL + `books/blocks/num/${bookId}/${rid}`;
      return axios.put(req, params)
      .then((response) => {
        if (response.data.updated && response.data.updated > 0) {
          let block = state.storeListO.getBlockByRid(params.rid);
          if (block) {
            block.isManual = true;
            return block.blockid;
          }
        }
        //console.log('response.data', response.data);
        if (Array.isArray(response.data)) {
          response.data.forEach((blockO)=>{
            state.storeListO.updBlockByRid(blockO.rid, blockO);
          })
        }
        return response.data;
      })
    },

    putNumBlockOBatch({commit, state}, params) {
      let bookId = encodeURIComponent(params.bookId);
      //let bookNum = encodeURIComponent(params.bookNum);
      let req = state.API_URL + `books/blocks/batch/num/${bookId}`;
      return axios.put(req, params)
      .then((response) => {
        if (Array.isArray(response.data)) response.data.forEach((blockO)=>{
          state.storeListO.updBlockByRid(blockO.rid, blockO);
        })
        return response.data;
      })
    },

    putMetaAuthors ({commit, state, dispatch}, authors) {
      let metaAuthors = [];
      authors.forEach((item)=>{
        metaAuthors.push({ name: item.text, color: item.color });
      })
      let upd = {authors: metaAuthors};
      return dispatch('updateBookMeta', upd);
    },

    getAudioBook ({state, commit}, bookid) {
      if (!bookid) {
        bookid = state.currentBookid;
      }
      if (!bookid) {
        return;
      }
      let set = bookid === state.currentBookid;
      return axios.get(state.API_URL + 'books/' + bookid + '/audiobooks')
        .then(audio => {
          if (audio.data) {
            if (set) {
              commit('set_currentAudiobook', audio.data);
            }
            return audio.data;
          } else {
            if (set) {
              commit('set_currentAudiobook', {});
            }
            return {};
          }
        })
        .catch(error => {
          if (set) {
            commit('set_currentAudiobook', {});
          }
          return {};
        });
    },

    tc_loadBookTask({state, commit, dispatch}, bookid) {
      //console.log('a1');
      if (state.loadBookTaskWait) {
        return state.loadBookTaskWait;
      }
      let address = state.API_URL + 'tasks';
      if (bookid) {
        address+='?bookid=' + bookid
      }
      state.loadBookTaskWait = axios.get(address)
      return state.loadBookTaskWait
        .then((list) => {
          //console.log('a2');
          state.loadBookTaskWait = null;
          state.tc_tasksByBlock = {}
          if (!bookid || !state.tc_userTasks.list) {
            state.tc_userTasks = {list: list.data, total: 0}
          } else {
            if (bookid && (!list.data || Object.keys(list.data).length === 0)) {
              Object.keys(state.tc_userTasks.list).forEach(k => {
                let t = state.tc_userTasks.list[k];
                if (t && t.bookid === bookid) {
                  delete state.tc_userTasks.list[k];
                }
              })
            } else {
              state.tc_userTasks.list = Object.assign(state.tc_userTasks.list, list.data);
              console.log(state.tc_userTasks.list)
            }
          }
          commit('TASK_LIST_LOADED')
          commit('PREPARE_BOOK_COLLECTIONS');
          dispatch('recountApprovedInRange');
          return list;
        })
        .catch(err => {
          state.loadBookTaskWait = null;
          console.log(err)
        })
    },

    tc_setCurrentBookTasks({state}) {
      state.tc_currentBookTasks = {"tasks": [], "job": {}, "assignments": [], "can_resolve_tasks": [], "is_proofread_unassigned": false};
      for (let jobid in state.tc_userTasks.list) {
        let job = state.tc_userTasks.list[jobid]
        if (job.bookid == state.currentBookid) {
          /*if (t.comment) {
            t.comment = t.comment.replace('\n', '<br>');
          }
          if (t.blockid) {
            state.tc_tasksByBlock[t.blockid] = t
          }*/
          state.tc_currentBookTasks = {job: job, tasks: job.tasks, can_resolve_tasks: job.can_resolve_tasks ? job.can_resolve_tasks : [], is_proofread_unassigned: job.is_proofread_unassigned ? job.is_proofread_unassigned : false}
        }
      }
      commit('ALLOW_BOOK_EDIT_MODE', state.tc_currentBookTasks.tasks.length > 0);
    },

    tc_approveBookTask({state, commit, dispatch}, task) {
      if (task.blockid) {
        state.approveBlocksList.push(task.blockid);
      }
      return axios.post(state.API_URL + 'task/' + task.blockid + '/approve_block',
      {
        'bookId': task.bookid || false,
        'taskId': task.id || false,
        'taskStep': task.nextStep || 'narrate-block',
        'taskType': task.type || false
      })
      .then((list) => {
        if (task.blockid) {
          state.approveBlocksList.forEach((_b, i) => {
            if (_b === task.blockid) {
              state.approveBlocksList.splice(i, 1);
            }
          })
        }
        //console.log('APPROVE TC', list)
        //state.tc_tasksByBlock = {}
        //state.tc_userTasks = {list: list.data.rows, total: 0}
        //commit('TASK_LIST_LOADED')
        if(Array.isArray(state.tc_currentBookTasks.tasks)) {// temporary remove current block task to disable it
          state.tc_currentBookTasks.tasks.forEach((t, i) => {
            if (t.blockid == task.blockid) {
              state.tc_currentBookTasks.tasks.splice(i, 1);
            }
          });
        }
        if (!state.tc_currentBookTasks.tasks || state.tc_currentBookTasks.tasks.length === 0) {
          state.tc_currentBookTasks.is_proofread_unassigned = false;
        }
        //state.tc_currentBookTasks = {"tasks": [], "job": {}, "assignments": []};
        if (state.replicatingDB.ilm_tasks !== true) {
          dispatch('tc_loadBookTask', task.bookid);
        }
        dispatch('getCurrentJobInfo');
        return Promise.resolve(list);
      })
      .catch(err => err)
    },

    getTotalBookTasks({state, commit}) {
      let allow_by_role = superlogin.confirmRole('librarian') || superlogin.confirmRole('admin')
      if (state.currentBookid && allow_by_role) {
        if (typeof state.currentBookMeta.version !== 'undefined' && state.currentBookMeta.version === state.currentBookMeta.publishedVersion) {
          commit('SET_ALLOW_BOOK_PUBLISH', false);
        } else {
          axios.get(state.API_URL + 'tasks/book/' + state.currentBookid + '/total')
            .then((response) => {
              commit('SET_ALLOW_BOOK_PUBLISH', typeof response.data !== 'undefined' && /^[0-9]+$/.test(response.data) && parseInt(response.data) === 0);
            })
            .catch((err) => {})
        }
      } else {
        commit('SET_ALLOW_BOOK_PUBLISH', false);
      }
    },

    setMetaData ({state, commit, dispatch}, data)
    {
      let keys = data.key.split('.');
      let key = keys[0];
      if (keys.length > 1) {
        state.currentBookMeta[keys[0]][keys[1]] = value;
        value = state.currentBookMeta[keys[0]];
      }

      let update = {
        [key]: data.value
      }

      var api = state.metaDB.hoodieApi();

      return api.update(state.currentBookMeta._id, update).then(doc => {
        //console.log('success DB update: ', doc)
        return dispatch('updateBookVersion', {minor: true})
        .then(() => {
          return Promise.resolve(doc);
        })
        .catch(err => {
          //console.log(err);
          return Promise.reject(err);
        });
      }).catch(err => {
        //console.log('error DB pdate: ', err)
        return Promise.reject(err);
      })
    },

    setCurrentBookCounters({state, commit, dispatch}, counters = []) {
      /*if (counters.length == 0 || counters.indexOf('narration_blocks') !== -1) {
        dispatch('_setNarrationBlocksCounter');
      }
      if (counters.length == 0 || counters.indexOf('not_marked_blocks') !== -1) {
        dispatch('_setNotMarkedAsDoneBlocksCounter');
      }
      if (counters.length == 0 || counters.indexOf('not_proofed_audio_blocks') !== -1) {
        dispatch('_setNotProofedAudioBlocksCounter');
      }*/
      if (counters.length == 0) {
        counters = ['narration_blocks', 'not_marked_blocks', 'not_proofed_audio'];
      }
      if (state.currentBookid) {
        counters.forEach(c => {
          //commit('SET_CURRENTBOOK_COUNTER', {name: c, value: '0'});
        });
        let bookid = state.currentBookid;
        let params = '';
        counters.forEach(c => {
          params+='counters[]=' + c + '&';
        });
        return axios.get(state.API_URL + 'books/' + bookid + '/counter/?' + params)
          .then(response => {
            if (response.data && response.data.count && Object.keys(response.data.count).length > 0) {
              Object.keys(response.data.count).forEach(k => {
                commit('SET_CURRENTBOOK_COUNTER', {name: k, value: response.data.count[k]});
              });
            }
          })
          .catch(err => {

          });
      }
    },

    _setNarrationBlocksCounter({state, commit}) {
      commit('SET_CURRENTBOOK_COUNTER', {name: 'narration_blocks', value: '0'});
      if (state.currentBookid) {
        let bookid = state.currentBookid;
        return axios.get(state.API_URL + 'books/' + bookid + '/counter/narration_blocks')
          .then(result => {
            commit('SET_CURRENTBOOK_COUNTER', {name: 'narration_blocks', value: result.data.count});
          })
          .catch(err => console.log(err));
      }
    },

    _setNotMarkedAsDoneBlocksCounter({state, commit}) {
      if (state.currentBookid) {
        let bookid = state.currentBookid;
        axios.get(state.API_URL + 'books/' + bookid + '/not_marked', {})
              .then(response => {
                commit('SET_CURRENTBOOK_COUNTER', {name: 'not_marked_blocks', value: response.data ? response.data.count : '0'});
              })
              .catch(err => {
                commit('SET_CURRENTBOOK_COUNTER', {name: 'not_marked_blocks', value: '0'})
                console.log(err)
              });
      } else {
        commit('SET_CURRENTBOOK_COUNTER', {name: 'not_marked_blocks', value: '0'})
      }
    },
    _setNotProofedAudioBlocksCounter({state, commit}) {
      commit('SET_CURRENTBOOK_COUNTER', {name: 'not_proofed_audio_blocks', value: '0'});
      if (state.currentBookid) {
        let tasks = [];
        let bookid = state.currentBookid;
        return axios.get(state.API_URL + 'books/' + bookid + '/counter/not_proofed_audio')
          .then(response => {
            commit('SET_CURRENTBOOK_COUNTER', {name: 'not_proofed_audio_blocks', value: response.data.count});
          })
          .catch(err => {

          });
      }
    },

    getTTSVoices({state, commit}, lang) {
      return axios.get(state.API_URL + 'tts/voices' + (lang ? `/${lang}` : ''))
      .then((response) => {
        commit('SET_TTS_VOICES', response.data);
        if (state.currentBookMeta && state.currentBookMeta.language == 'en') {
          let default_voice = null;
          state.ttsVoices.forEach(group => {
            if (!default_voice && group.children) {
              default_voice = group.children.find(ch => ch.id == 'Brian');
            }
          });
          if (default_voice && Object.keys(state.currentBookMeta.voices).length > 0) {
            for (let type in state.currentBookMeta.voices) {
              if (!state.currentBookMeta.voices[type]) {
                state.currentBookMeta.voices[type] = default_voice.id
              }
            }
          }
        }
      })
      .catch(err => err)
    },

    getTestSpeech({state, commit}, data) {
      return axios.get(state.API_URL + `tts/testspeech/${data.voiceId}/${data.text}`)
      .then((response) => {
        return response;
      })
      .catch(err => err)
    },

    freeze({commit}, bName) {
      commit('set_blocker', bName);
    },

    unfreeze({commit}, bName) {
      commit('clear_blocker', bName);
    },

    addBlockLock({commit}, data) {
      commit('add_block_lock', data);
    },

    clearBlockLock({commit}, data) {
      commit('clear_block_lock', data);
    },

    setBlockSelection({state, commit, dispatch}, selection) {
      if (!_.isEqual(state.blockSelection, selection)) {
        commit('set_block_selection', selection);
        dispatch('getAlignCount', selection);
        dispatch('recountApprovedInRange', selection);
      }
    },

    getAlignCount({state, commit}, selection) {
      if (!selection) {
        selection = state.blockSelection;
      }
      if (selection.start && selection.start._id &&
                selection.end && selection.end._id) {
        let api_url = state.API_URL + 'books/' + state.currentBookid + '/selection_alignment';
        let query = 'start=' + selection.start._id + '&end=' + selection.end._id;
        let realign = /*state.tc_currentBookTasks.assignments &&
                (state.tc_currentBookTasks.assignments.indexOf('audio_mastering') !== -1 ||
                  (state.tc_currentBookTasks.assignments.indexOf('content_cleanup') !== -1 && state.currentBookCounters.not_marked_blocks === 0))*/true;
        //if (realign) {
          //query+='&voicework=all_audio&realign=true';
        //} else { // In case of normal task (with tts counter)
          query+='&voicework=all_audio&realign=true';
        //}
        state.selectionXHR = Date.now();
        let run = state.selectionXHR;
        return axios.get(api_url + '?' + query, {})
          .then(response => {
            if (response.status == 200 && run === state.selectionXHR) {
              commit('set_align_counter', {
                count: response.data.count,
                countTTS: response.data.countTTS,
                countAudio: response.data.countAudio,
                blocks: response.data.blocks
              });
            }
            return Promise.resolve();
          })
          .catch(err => Promise.reject(err));
      } else {
        commit('set_align_counter', {
          count: 0,
          countTTS: 0,
          blocks: []
        });
      }
    },

    saveChangedBlocks({state, dispatch, commit}, data = {}) {
      if (state.blockSelection.start._id && state.blockSelection.end._id) {
        let wait_tasks = [];
        let crossId = state.blockSelection.start._id;
        let ids = [];
        for (var idx=0; idx < state.storeList.size; idx++) {
          let block = state.storeList.get(crossId);
          if (block) {
            if (block.isChanged || block.isAudioChanged) {
              if ((block.voicework === 'audio_file' && data.voicework === 'audio_file') ||
                      (block.voicework === 'tts' && data.voicework === 'tts')) {
                wait_tasks.push(dispatch('putBlock', block)
                        .then(() => {
                          block.isChanged = false;
                          block.isAudioChanged = false;
                          //commit('set_storeList', block);
                          return Promise.resolve(block);
                        }));
                ids.push(block._id);
              }
            }
            if (block._id == state.blockSelection.end._id) {
              break;
            }
            crossId = block.chainid;
          } else break;
        }
        return Promise.all(wait_tasks)
          .then((results) => {
            return Promise.resolve(ids);
          })
          .catch(err => {
            console.log(err);
            return Promise.resolve(ids);
          });
      }
    },
    recountApprovedInRange({state, commit}, selection = null) {
      let approved = 0;
      let approved_tts = 0;
      let approved_narration = 0;
      let changed_in_range = 0;
      let changed_in_range_tts = 0;
      let changed_in_range_narration = 0;
      if (!selection) {
        selection = state.blockSelection;
      }
      if (selection.start && selection.start._id && selection.end && selection.end._id) {
        let crossId = selection.start._id;
        for (var idx=0; idx < state.storeList.size; idx++) {
          let block = state.storeList.get(crossId);
          if (block) {
            let hasAssignment = state.currentJobInfo.mastering  || state.currentJobInfo.text_cleanup;
            let hasTask = state.tc_currentBookTasks.tasks.find((t) => {
              return t.blockid == block._id;
            })
            //if (!hasAssignment && state.adminOrLibrarian) {
              //hasAssignment = state.currentJobInfo.completed;
            //}
            if (!hasTask && state.adminOrLibrarian) {
              hasTask = state.currentJobInfo.can_resolve_tasks.find((t) => {
                return t.blockid == block._id;
              });
            }
            if ((block.status && block.status.marked) || (!hasAssignment && !hasTask)) {
              switch (block.voicework) {
                case 'audio_file' :
                  ++approved;
                  break;
                case 'tts':
                  ++approved_tts;
                  break;
                case 'narration':
                  ++approved_narration;
                  break;
              }
              if (block.voicework !== 'tts' && block.footnotes && Array.isArray(block.footnotes) && block.footnotes.length > 0) {
                let ftn = block.footnotes.find(f => {
                  return f.voicework === 'tts';
                });
                if (ftn) {
                  ++approved_tts;
                }
              }
            }
            if (block.isChanged || block.isAudioChanged) {
              if (block.voicework === 'audio_file') {
                ++changed_in_range;
              }
              if (block.voicework === 'tts') {
                ++changed_in_range_tts;
              }
              if (block.voicework === 'narration') {
                ++changed_in_range_narration;
              }
            }
            if (block._id == selection.end._id) {
              break;
            }
            crossId = state.storeListO.getOutId(block.blockid);
            if (!crossId) {
              break;
            }
          } else break;
        }
      }
      let audio_mastering = state.tc_currentBookTasks.assignments && state.tc_currentBookTasks.assignments.indexOf('audio_mastering') !== -1;
      if (audio_mastering) {
        approved+= approved_narration;
        changed_in_range+=changed_in_range_narration;
      }
      commit('SET_CURRENTBOOK_COUNTER', {name: 'approved_audio_in_range', value: approved});
      commit('SET_CURRENTBOOK_COUNTER', {name: 'approved_tts_in_range', value: approved_tts});
      commit('SET_CURRENTBOOK_COUNTER', {name: 'changed_in_range_audio', value: changed_in_range});
      commit('SET_CURRENTBOOK_COUNTER', {name: 'changed_in_range_tts', value: changed_in_range_tts});
    },
    clearLocks({state, commit}, data) {
      if (data.type) {
        if (state.lockedBlocks.length > 0) {
          let list = state.lockedBlocks.filter(r =>  r.type === data.type);
          list.forEach(r =>  {
            commit('clear_block_lock', {block: {_id: r._id}, force: true})
          })
        }
      }
    },
    startAlignWatch({state, commit, dispatch}) {
      if (state.currentBookid) {
        if (state.alignWatch) {
          clearInterval(state.alignWatch);
        }
        dispatch('getBookAlign');
        state.alignWatch = setInterval(() => {
          dispatch('getBookAlign');
        }, 15000);
      }
    },
    getBookAlign({state, commit, dispatch}) {
      if (state.currentBookid) {
        let api_url = state.API_URL + 'align_queue/' + state.currentBookid;
        axios.get(api_url, {})
          .then(response => {
            if (response.status == 200) {
              let oldBlocks = state.aligningBlocks;
              let blocks = response.data;
              let checks = [];
              if (oldBlocks.length > 0) {
                oldBlocks.forEach(b => {
                  let _b = blocks.find(bb => bb.blockid == b._id);
                  if (!_b) {
                    let blockStore = state.storeList.get(b._id);
                    if (blockStore) {
                      //blockStore.content+=' realigned';
                      checks.push(dispatch('getBlock', b._id)
                        .then(block => {
                          store.commit('set_storeList', new BookBlock(block));
                          return Promise.resolve();
                        })
                        .catch(err => {
                          console.log(err);
                          return Promise.resolve();
                        })
                      );
                    }
                  }
                });
              }
              Promise.all(checks)
                .then(() => {
                  if (oldBlocks.length != blocks.length) {
                    dispatch('getAudioBook');
                    dispatch('getCurrentJobInfo');
                  }
                  commit('set_aligning_blocks', response.data);
                  if (checks.length > 0) {
                    dispatch('_setNotMarkedAsDoneBlocksCounter');
                    dispatch('recountApprovedInRange');
                    state.storeListO.refresh();
                  }
                })
            }
            return Promise.resolve();
          })
          .catch(err => Promise.reject(err));
      }
    },
    startAudiobookWatch({state, dispatch}) {
      if (state.audiobookWatch) {
        clearInterval(state.audiobookWatch);
      }
      state.audiobookWatch = setInterval(() => {
        dispatch('getAudioBook')
      }, 15000);
    },
    getCurrentJobInfo({state}) {
      /*state.currentJobInfo = {
        can_resolve_tasks: [],
        mastering: null,
        proofing: null,
        published: null,
        text_cleanup: null,
        is_proofread_unassigned: null
      };*/
      return axios.get(state.API_URL + 'tasks/book/' + state.currentBookid + '/job_info')
        .then(data => {
          state.currentJobInfo = data.data;
          return Promise.resolve();
        })
        .catch(err => {
          console.log(err);
          return Promise.reject(err);
        })
    },
    getTaskTypes({state}) {
      return axios.get(state.API_URL + 'tasks/types').then(types => {
        state.taskTypes = types.data
        return Promise.resolve(state.taskTypes)
      })
      .catch(error => {
        return Promise.reject({})
      })
    }
  }
})

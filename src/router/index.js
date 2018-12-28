import Vue from 'vue'
import Router from 'vue-router'

import Books from '../components/Books'

import BooksGrid from '../components/books/BooksGrid'
import BookEdit from '../components/books/BookEdit'
import BookEditDisplay from '../components/books/BookEdit_Display'

import Users from '../components/Users'
import Libraries from '../components/Libraries'
import Tasks from '../components/Tasks'
import Help from '../components/Help'
import Contact from '../components/Contact'
import Align from '../components/Align'
import AudioEditor from '../components/AudioEditor'
import Collections from '../components/Collections'
import CollectionsGrid from '../components/collections/CollectionsGrid';

Vue.use(Router)

// const NotFound = { template: '<p>Page not found</p>' }

export default new Router({
  mode: 'history',
  linkActiveClass: 'active',
  routes: [
    {
      path: '/books',
      component: Books,
      name: 'BooksList',
      children: [
        { path: '', component: BooksGrid }
      ]
    },
    {
      path: '/books/:bookid',
      component: Books,
      name: 'Book',
      children: [
        { path: '', component: BooksGrid, name: 'BooksGrid' },
        {
          path: 'edit/:block?/:task_type?', name: 'BookEdit',
          component: BookEdit, meta: { mode: 'edit' }, props: { mode: 'edit' }
        },
        {
          path: 'display/:block?/:task_type?', name: 'BookEditDisplay',
          component: BookEditDisplay, meta: { mode: 'edit' }
        },
        {
          path: 'narrate/:block?/:task_type?', name: 'BookNarrate',
          component: BookEdit, meta: { mode: 'narrate' }, props: { mode: 'narrate' }
        }
      ]
    },
//     {
//       path: '/books/edit/:bookid',
//       component: Books
//     },

    {
      path: '/users',
      component: Users
    },
    {
      path: '/libraries',
      component: Libraries
    },
    {
      path: '/libraries/:libraryid',
      component: Libraries
    },
    {
      path: '/library-books',
      component: Libraries
    },
    {
      path: '/assignments',
      component: Tasks
    },
    {
      path: '/help',
      component: Help
    },
    {
      path: '/contact',
      component: Contact
    },
    {
      path: '/align',
      component: Align
    },
    {
      path: '/audio_editor',
      component: AudioEditor
    },
    {
      path: '/collections',
      component: Collections,
      name: 'CollectionsList',
      props: { mode: 'edit1' }
    },
    {
      path: '/collections/:collectionid',
      component: Collections,
      name: 'Collection'
    },
    {path: '/collections/:collectionid/:bookid', component: Collections, name: 'CollectionBook'},
    {
      path: '/collections/:collectionid/:bookid/edit/:block?/:task_type?', name: 'CollectionBookEdit',
      component: Collections, meta: { mode: 'edit' }, props: { mode: 'edit' }
    },
    {
      path: '/collections/:collectionid/:bookid/display/:block?', name: 'CollectionBookEditDisplay',
      component: Collections, meta: { mode: 'edit' }
    },
    {
      path: '/collections/:collectionid/:bookid/narrate/:block?/:task_type?', name: 'CollectionBookNarrate',
      component: Collections, meta: { mode: 'narrate' }, props: { mode: 'narrate' }
    },
    { path: '*', redirect: '/books' }
  ]
})

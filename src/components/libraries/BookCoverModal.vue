<template>
  <div>
    <modal name="import-cover"
      transition="nice-modal-fade"
      :adaptive="false"
      width="700px"
      height="430px"
      @before-open="modalOpened"
      @before-close="modalClosed"
      :class="'upload-cover-modal'">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close" v-on:click="close()">
          <i class="fa fa-times-circle-o" aria-hidden="true"></i>
        </button>
        <img src='/static/bookstack.svg' class='book-logo'> <h3 class="header-h">Edit Cover</h3>
      </div>
      <div class="modal-body">
        <div id="upload_pane" class="tab-pane fade in">
          <div class="row">
            <div class="col-md-12">

              <div class="col-sm-4">
                <img :src="uploadImage" class="preview-upload" v-show="uploadImage.length>0" />
              </div>

              <div class="col-sm-8">
                <div class="input-group">
                  <span class="input-group-addon"><i class="fa fa-globe"></i></span>
                  <input type="text" class="form-control" placeholder="URL" v-model="uploadURL" />
                </div>

                <br> &nbsp;&nbsp;&nbsp;  or <br><br>

                <label class='btn btn-default' type="file">
                  <i class="fa fa-folder-open-o" aria-hidden="true"></i> &nbsp; Browse for cover file &hellip;
                  <input name="coverFile" type="file" v-show="false" accept="image/*" class="upload-image-input" @change="onFilesChange($event)"><br>
                </label>
              </div>

            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" v-on:click="save()">Save</button>
      </div>
    </modal>
  </div>
</template>
<script>
  import modal from 'vue-js-modal';
  import Vue from 'vue';
  import { mapActions, mapGetters } from 'vuex';
  Vue.use(modal);
  export default {
      name: 'BookCoverModal',
      data() {
        return {
          uploadImage: '',
          uploadURL: ''
        }
      },
      props: [
        'libraryId', 'bookId', 'currentImage'
      ],
      mounted() {
        
      },
      methods: {
        show() {
          this.uploadImage = this.currentImage || '';
          this.uploadURL = '';
          this.$modal.show('import-cover');
        },
        close() {
          this.$modal.hide('import-cover');
        },
        modalOpened() {
          $('.fixed-wrapper .navtable').css('z-index', 0);
          $('.nav-tabs-wrapper').css('z-index', 0);
          $('.toolbar-wrapper .toolbar').css('z-index', 0);
        },
        modalClosed() {
          $('.fixed-wrapper .navtable').css('z-index', 999);
          $('.nav-tabs-wrapper').css('z-index', 999);
          $('.toolbar-wrapper .toolbar').css('z-index', 999);
        },
        onFilesChange (e) {
          var files = e.target.files || e.dataTransfer.files;
          // console.log('*** onFilesChange', files)
          if (!files.length) {
            return;
          }
          this.createImage(files[0]);
        },

        createImage (file) {
          // console.log('*** Creating new image', file)
          var reader = new FileReader();
          var vm = this;
          reader.onload = e => { vm.uploadImage = e.target.result };
          reader.readAsDataURL(file);
        },
        save() {
          if (this.uploadImage) {
            this.uploadNewImageData(this.uploadImage);
          } else if (this.uploadURL) {
            this.uploadNewImageUrl();
          }
        },
        uploadNewImageData (urlData) {
          if (urlData.length < 1) {
            return;
          }
          
          let item_id = 'lib-' + this.libraryId + '-book-' + this.bookId;
          let ilm_library_files = this.$store.state.filesRemoteDB;

          return ilm_library_files.get(item_id)
            .then(doc => {
              // cut out mime type part
              let mime = urlData.substring(urlData.indexOf(':') + 1, urlData.indexOf(';'));
              // cut out data part
              urlData = urlData.substring(urlData.indexOf(',') + 1);

              doc._attachments = (doc._attachments || {});
              doc._attachments.coverimg = {content_type: mime, data: urlData};

              return ilm_library_files.put(doc)
                .then((doc)=>{
                  this.$emit('imageUpdated');
                  this.close();
                  //return this.reloadCollection();
                  //this.updateCollectionVersion({minor: true});
                })
                .catch(err => console.log(err));
            }).catch(err => {
              if (err.name === 'not_found') {
                return ilm_library_files.put({_id: item_id, type: 'library_book', libraryId: this.libraryId, bookId: this.bookId})
                  .then(doc => {
                    return this.uploadNewImageData(urlData);
                  });
              } else {
                console.log('Oops, we should not ever be here... ', err);
              }
            })
        },
        uploadNewImageUrl() {
          var vm = this
          return new Promise((resolve, reject) => {
            var image = new Image()
            image.crossOrigin = 'anonymous'
            image.onload = function () {
              var canvas = document.createElement('canvas')
              canvas.width = this.naturalWidth // or 'width' if you want a special/scaled size
              canvas.height = this.naturalHeight // or 'height' if you want a special/scaled size
              canvas.getContext('2d').drawImage(this, 0, 0)
              resolve(vm.uploadNewImageData(canvas.toDataURL('image/png')))
            }
            image.src = vm.uploadURL;
          })
        }/*,
        ...mapActions(['reloadCollection', 'updateCollectionVersion'])*/
      },
      computed: {
        //...mapGetters(['currentCollection'])
      },
      watch: {
        uploadImage: {
          handler(val) {
            if (val) {
              this.uploadURL = '';
            } else {
              $('.upload-image-input').val('');
            }
          }
        },
        uploadURL: {
          handler(val) {
            if (val) {
              this.uploadImage = '';
            }
          }
        }
      }
  }
</script>
<style lang="less">
  .upload-cover-modal {
    .tab-pane {
      display: block;
    }
    .book-logo {
      width: 35px;
    }
    .modal-header {
      padding: 10px 20px;
      text-align: center;
      h3 {
        display: inline-block;
      }
    }
    .preview-upload {
      max-width: 200px;
      max-height: 250px;
    }
  }
</style>
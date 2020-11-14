import { remove } from 'fs-extra'; //文件操作
import {
  ES_DIR, //es 目录路径
  LIB_DIR, //lib 目录路径
  DIST_DIR,//dist 目录
  VETUR_DIR,//vetur 目录
  SITE_DIST_DIR,//site_dist 目录
} from '../common/constant';

export async function clean() {
  await Promise.all([
    remove(ES_DIR),
    remove(LIB_DIR),
    remove(DIST_DIR),
    remove(VETUR_DIR),
    remove(SITE_DIST_DIR),
  ]);
}

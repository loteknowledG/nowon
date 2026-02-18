import json
from samus_manus_mvp.memory import Memory


def test_add_and_all(tmp_path):
    db = tmp_path / 'mem.db'
    m = Memory(str(db))
    rid = m.add('note', 'Remember to water plants', metadata={'tag': 'test'})
    all_items = m.all(limit=10)
    assert len(all_items) == 1
    assert all_items[0]['text'] == 'Remember to water plants'
    assert all_items[0]['metadata'].get('tag') == 'test'


def test_query_similar_fallback(tmp_path):
    db = tmp_path / 'mem2.db'
    m = Memory(str(db))
    m.add('note', 'Buy milk', metadata={})
    m.add('note', 'Call mom', metadata={})
    res = m.query_similar('buy', top_k=2)
    assert any('Buy milk' in r['text'] for r in res)


def test_rebuild_missing_embeddings_no_api(tmp_path):
    db = tmp_path / 'mem3.db'
    m = Memory(str(db))
    m.add('note', 'Some text', {})
    updated = m.rebuild_missing_embeddings(limit=10)
    assert updated == 0
